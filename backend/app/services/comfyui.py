import asyncio
import uuid
import json
from typing import Any

import httpx

from app.core.config import settings


class ComfyUIService:
    def __init__(self) -> None:
        self.base_url = settings.COMFYUI_URL
        self.client_id = str(uuid.uuid4())

    async def upload_image(self, image_bytes: bytes, filename: str) -> str:
        """Upload image to ComfyUI, return filename."""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/upload/image",
                files={"image": (filename, image_bytes, "image/png")},
                data={"overwrite": "true"},
            )
            response.raise_for_status()
            data = response.json()
            return data["name"]

    async def queue_prompt(self, workflow: dict[str, Any]) -> str:
        """Queue a workflow prompt, return prompt_id."""
        async with httpx.AsyncClient(timeout=30) as client:
            payload = {"prompt": workflow, "client_id": self.client_id}
            response = await client.post(
                f"{self.base_url}/prompt",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["prompt_id"]

    async def get_history(self, prompt_id: str) -> dict[str, Any] | None:
        """Get history for a prompt. Returns None if not done yet."""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(f"{self.base_url}/history/{prompt_id}")
            response.raise_for_status()
            data = response.json()
            if prompt_id not in data:
                return None
            return data[prompt_id]

    async def wait_for_completion(self, prompt_id: str, max_wait: int = 300) -> dict[str, Any]:
        """Poll until workflow is complete. Returns output dict."""
        waited = 0
        while waited < max_wait:
            history = await self.get_history(prompt_id)
            if history is not None:
                return history
            await asyncio.sleep(2)
            waited += 2
        raise TimeoutError(f"ComfyUI timeout after {max_wait}s for prompt {prompt_id}")

    async def get_output_image(self, history: dict[str, Any]) -> bytes | None:
        """Extract first output image from history and download it."""
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
        """Inject input image filename and user params into workflow nodes."""
        import random

        workflow = json.loads(json.dumps(workflow))  # deep copy

        # Extract __meta__ section (not a real ComfyUI node)
        meta = workflow.pop("__meta__", {})
        default_prompt = meta.get("default_prompt", "")

        # Resolve prompt: user-supplied wins, then workflow default
        prompt = str(params.get("prompt", default_prompt)).strip()

        for node in workflow.values():
            if not isinstance(node, dict):
                continue
            inputs = node.get("inputs", {})

            # Replace input image placeholder
            if inputs.get("image") == "__INPUT_IMAGE__":
                inputs["image"] = image_filename

            # Replace prompt placeholder
            if inputs.get("text") == "__PROMPT__":
                inputs["text"] = prompt

            # Randomise seed if not explicitly set by user
            if "seed" in inputs and isinstance(inputs["seed"], int):
                inputs["seed"] = int(params.get("seed", random.randint(0, 2**32 - 1)))

            # Inject any remaining custom params by input key
            for key, value in params.items():
                if key in ("prompt", "seed"):
                    continue  # already handled above
                if key in inputs:
                    inputs[key] = value

        return workflow


