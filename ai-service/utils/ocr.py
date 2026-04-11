from __future__ import annotations

import asyncio
from io import BytesIO

import numpy as np
from PIL import Image
from rapidocr_onnxruntime import RapidOCR


_ocr_engine: RapidOCR | None = None


def _get_engine() -> RapidOCR:
    global _ocr_engine
    if _ocr_engine is None:
        _ocr_engine = RapidOCR()
    return _ocr_engine


def _extract_text_sync(image_bytes: bytes) -> str:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    image_array = np.array(image)

    engine = _get_engine()
    result, _ = engine(image_array)

    if not result:
        return ""

    lines: list[str] = []
    for item in result:
        if len(item) >= 2 and isinstance(item[1], str):
            lines.append(item[1])
    return "\n".join(lines).strip()


async def extract_text_from_image(image_bytes: bytes) -> str:
    if not image_bytes:
        return ""
    return await asyncio.to_thread(_extract_text_sync, image_bytes)
