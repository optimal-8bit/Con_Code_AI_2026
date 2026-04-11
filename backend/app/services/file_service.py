"""
File handling service: upload, extract text from PDFs/images, audio.
"""
from __future__ import annotations

import base64
import io
import logging
import os
import uuid
from pathlib import Path
from typing import Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_DOC_TYPES = {"application/pdf"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"}


class FileService:
    def __init__(self) -> None:
        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        for sub in ["images", "documents", "audio", "prescriptions", "reports"]:
            (self.upload_dir / sub).mkdir(exist_ok=True)

    def save_upload(self, file_bytes: bytes, original_filename: str, subfolder: str = "images") -> str:
        """Save uploaded bytes to disk, return relative URL path."""
        ext = Path(original_filename).suffix.lower() or ".bin"
        filename = f"{uuid.uuid4().hex}{ext}"
        dest = self.upload_dir / subfolder / filename
        dest.write_bytes(file_bytes)
        return f"/uploads/{subfolder}/{filename}"

    def file_to_base64(self, file_bytes: bytes) -> str:
        return base64.b64encode(file_bytes).decode("utf-8")

    def extract_pdf_text(self, file_bytes: bytes) -> str:
        """Extract text from PDF using PyMuPDF."""
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            texts = [page.get_text() for page in doc]
            return "\n".join(texts)
        except ImportError:
            logger.warning("PyMuPDF not installed; PDF text extraction unavailable.")
            return ""
        except Exception as exc:
            logger.error("PDF extraction error: %s", exc)
            return ""

    def detect_mime_type(self, file_bytes: bytes, filename: str) -> str:
        """Detect MIME type from content."""
        ext = Path(filename).suffix.lower()
        ext_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif",
            ".pdf": "application/pdf",
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav",
            ".ogg": "audio/ogg",
            ".webm": "audio/webm",
        }
        return ext_map.get(ext, "application/octet-stream")

    def validate_file_size(self, file_bytes: bytes) -> bool:
        return len(file_bytes) <= settings.max_upload_bytes

    def process_prescription_image(self, file_bytes: bytes, filename: str) -> Tuple[str, str]:
        """
        Process prescription image: save and return (url, base64).
        """
        url = self.save_upload(file_bytes, filename, "prescriptions")
        b64 = self.file_to_base64(file_bytes)
        return url, b64

    def process_report_file(self, file_bytes: bytes, filename: str) -> Tuple[str, str, str]:
        """
        Process a medical report (PDF or image).
        Returns (url, extracted_text, base64_for_vision).
        """
        mime = self.detect_mime_type(file_bytes, filename)
        url = self.save_upload(file_bytes, filename, "reports")
        b64 = self.file_to_base64(file_bytes)
        
        extracted_text = ""
        if mime == "application/pdf":
            extracted_text = self.extract_pdf_text(file_bytes)
        
        return url, extracted_text, b64 if mime in ALLOWED_IMAGE_TYPES else ""


file_service = FileService()
