import uuid
from pathlib import Path
from urllib.parse import urlparse

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
                policy = (
                    '{"Version":"2012-10-17","Statement":[{"Effect":"Allow",'
                    '"Principal":"*","Action":"s3:GetObject",'
                    f'"Resource":"arn:aws:s3:::{self.bucket}/*"}}]}}'
                )
                self.s3.put_bucket_policy(Bucket=self.bucket, Policy=policy)
            except Exception:
                pass

    def upload_bytes(self, data: bytes, filename: str, content_type: str = "image/png") -> str:
        key = f"images/{uuid.uuid4().hex}/{filename}"
        self.s3.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType=content_type)
        return f"{settings.STORAGE_PUBLIC_URL}/{key}"

    def upload_file(self, file_path: str, filename: str | None = None) -> str:
        path = Path(file_path)
        name = filename or path.name
        key = f"images/{uuid.uuid4().hex}/{name}"
        self.s3.upload_file(file_path, self.bucket, key)
        return f"{settings.STORAGE_PUBLIC_URL}/{key}"

    def download_from_url(self, url: str) -> bytes:
        """Download from MinIO via S3 client directly (no external HTTP)."""
        public_base = settings.STORAGE_PUBLIC_URL.rstrip("/")
        if url.startswith(public_base):
            key = url[len(public_base):].lstrip("/")
        else:
            parsed = urlparse(url)
            parts = parsed.path.lstrip("/").split("/", 1)
            key = parts[1] if len(parts) > 1 else parts[0]
        response = self.s3.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()
