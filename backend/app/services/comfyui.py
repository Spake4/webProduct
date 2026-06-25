import asyncio
import uuid
import json
from typing import Any, Callable, Awaitable

import httpx

from app.core.config import settings


class ComfyUIService:
    def __init__(self) -> None:
        self.base_url = settings.COMFYUI_URL
        self.client_id = str(uuid.uuid4())

    async def upload_image(self, image_bytes: bytes, filename: str) -> str:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/upload/image",
                files={"image": (filename, image_bytes, "image/png")},
                data={"overwrite": "true"},
            )
            response.raise_for_status()
            return response.json()["name"]

    async def queue_prompt(self, workflow: dict[str, Any]) -> str:
        async with httpx.AsyncClient(timeout=30) as client:
            payload = {"prompt": workflow, "client_id": self.client_id}
            response = await client.post(f"{self.base_url}/prompt", json=payload)
            response.raise_for_status()
            return response.json()["prompt_id"]

    async def get_history(self, prompt_id: str) -> dict[str, Any] | None:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(f"{self.base_url}/history/{prompt_id}")
            response.raise_for_status()
            data = response.json()
            return data.get(prompt_id)

    async def get_queue_status(self, prompt_id: str) -> str:
        """Returns 'pending', 'running', or 'done'."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{self.base_url}/queue")
                response.raise_for_status()
                data = response.json()
            running_ids = {item[1] for item in data.get("queue_running", [])}
            pending_ids = {item[1] for item in data.get("queue_pending", [])}
            if prompt_id in running_ids:
                return "running"
            if prompt_id in pending_ids:
                return "pending"
            return "done"
        except Exception:
            return "running"

    async def wait_for_completion(
        self,
        prompt_id: str,
        max_wait: int = 300,
        on_progress: Callable[[int], Awaitable[None]] | None = None,
    ) -> dict[str, Any]:
        """Poll until workflow is complete. Calls on_progress(pct) with 30-85% during run."""
        waited = 0
        last_progress = 30
        while waited < max_wait:
            history = await self.get_history(prompt_id)
            if history is not None:
                if on_progress:
                    await on_progress(90)
                return history

            queue_state = await self.get_queue_status(prompt_id)
            if queue_state == "pending":
                pct = 30
            else:
                # running — increase from 40 to 85 based on elapsed time (assume ~60s avg)
                elapsed_pct = min(int(waited / 60 * 45), 45)
                pct = max(40 + elapsed_pct, last_progress)

            if on_progress and pct != last_progress:
                await on_progress(pct)
                last_progress = pct

            await asyncio.sleep(2)
            waited += 2

        raise TimeoutError(f"ComfyUI timeout after {max_wait}s for prompt {prompt_id}")

    async def get_output_image(self, history: dict[str, Any]) -> bytes | None:
        outputs = history.get("outputs", {})
        for node_output in outputs.values():
            if "images" in node_output:
                for img in node_output["images"]:
                    filename = img["filename"]
                    subfolder = img.get("subfolder", "")
                    img_type = img.get("type", "output")
                    params = f"filename={filename}&subfolder={subfolder}&type={img_type}"
                    async with httpx.AsyncClient(timeout=60) as client:
                        response = await client.get(f"{self.base_url}/view?{params}")
                        response.raise_for_status()
                        return response.content
        return None

    def inject_image_into_workflow(
        self, workflow: dict[str, Any], image_filename: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        import random
        workflow = json.loads(json.dumps(workflow))
        meta = workflow.pop("__meta__", {})
        default_prompt = meta.get("default_prompt", "")
        prompt = str(params.get("prompt", default_prompt)).strip()

        for node in workflow.values():
            if not isinstance(node, dict):
                continue
            inputs = node.get("inputs", {})
            if inputs.get("image") == "__INPUT_IMAGE__":
                inputs["image"] = image_filename
            if inputs.get("text") == "__PROMPT__":
                inputs["text"] = prompt
            if "seed" in inputs and isinstance(inputs["seed"], int):
                inputs["seed"] = int(params.get("seed", random.randint(0, 2**32 - 1)))
            for key, value in params.items():
                if key in ("prompt", "seed"):
                    continue
                if key in inputs:
                    inputs[key] = value

        return workflow
