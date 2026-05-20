import uuid
from pathlib import Path

import boto3
from botocore.client import Config

from app.core.config import settings


class StorageService:
    def __init__(self) -> None:
        self.s3 = boto3.client(
            "s3",
            endpoint_url=settings.STORAGE_ENDPOINT,
            aws_access_key_id=settings.STORAGE_ACCESS_KEY,
            aws_secret_access_key=settings.STORAGE_SECRET_KEY,
            config=Config(signature_version="s3v4"),
        )
        self.bucket = settings.STORAGE_BUCKET
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        try:
            self.s3.head_bucket(Bucket=self.bucket)
        except Exception:
            try:
                self.s3.create_bucket(Bucket=self.bucket)
                # Make bucket public readable
                self.s3.put_bucket_policy(
                    Bucket=self.bucket,
                    Policy=f'{{"Version":"2012-10-17","Statement":[{{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::{self.bucket}/*"}}]}}',
                )
            except Exception:
                pass  # might already exist with different permissions

    def upload_bytes(self, data: bytes, filename: str, content_type: str = "image/png") -> str:
        """Upload bytes to storage, return public URL."""
        key = f"images/{uuid.uuid4().hex}/{filename}"
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return f"{settings.STORAGE_PUBLIC_URL}/{key}"

    def upload_file(self, file_path: str, filename: str | None = None) -> str:
        """Upload local file to storage, return public URL."""
        path = Path(file_path)
        name = filename or path.name
        key = f"images/{uuid.uuid4().hex}/{name}"
        self.s3.upload_file(file_path, self.bucket, key)
        return f"{settings.STORAGE_PUBLIC_URL}/{key}"

    def download_from_url(self, url: str) -> bytes:
        """Download file from storage URL."""
        import httpx
        response = httpx.get(url, timeout=60)
        response.raise_for_status()
        return response.content


