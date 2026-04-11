"""
Cloudinary upload service for prescription documents/images.
"""
from __future__ import annotations

import io
import logging

import cloudinary
import cloudinary.uploader

from app.core.config import settings

logger = logging.getLogger(__name__)


class CloudinaryService:
    def __init__(self) -> None:
        self.enabled = settings.cloudinary_enabled
        if self.enabled:
            cloudinary.config(
                cloud_name=settings.cloudinary_cloud_name,
                api_key=settings.cloudinary_api_key,
                api_secret=settings.cloudinary_api_secret,
                secure=True,
            )

    def upload_prescription_file(self, file_bytes: bytes, filename: str) -> dict:
        if not self.enabled:
            raise RuntimeError("Cloudinary is not configured.")

        upload_result = cloudinary.uploader.upload(
            io.BytesIO(file_bytes),
            folder="nextgen_health/prescriptions",
            resource_type="auto",
            use_filename=True,
            unique_filename=True,
            filename_override=filename,
        )

        return {
            "url": upload_result.get("secure_url") or upload_result.get("url"),
            "public_id": upload_result.get("public_id"),
            "resource_type": upload_result.get("resource_type"),
            "format": upload_result.get("format"),
        }


cloudinary_service = CloudinaryService()
