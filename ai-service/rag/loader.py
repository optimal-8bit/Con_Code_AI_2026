from __future__ import annotations

import asyncio
import os
import tempfile
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document


def _load_pdf_sync(file_path: str) -> list[Document]:
    loader = PyPDFLoader(file_path)
    return loader.load()


async def load_pdf_documents(file_bytes: bytes) -> list[Document]:
    if not file_bytes:
        return []

    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        return await asyncio.to_thread(_load_pdf_sync, tmp_path)
    finally:
        if tmp_path and Path(tmp_path).exists():
            os.remove(tmp_path)
