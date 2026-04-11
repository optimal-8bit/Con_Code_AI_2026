from __future__ import annotations

import logging
from typing import Any

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from config.settings import get_chat_model
from utils.ocr import extract_text_from_image


logger = logging.getLogger("healthcare_ai.prescription")


class PrescriptionItem(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    instructions: str


class PrescriptionAnalysisOutput(BaseModel):
    medicines: list[PrescriptionItem] = Field(default_factory=list)
    notes: str | None = None


PRESCRIPTION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You extract medicine details from prescription text. "
            "Use only the provided text and do not invent medicines.",
        ),
        (
            "human",
            "Patient context:\n{patient_context}\n\n"
            "Prescription OCR Text:\n{text}\n\n"
            "Extract each medicine with dosage, frequency, and patient instructions.",
        ),
    ]
)


async def analyze_prescription_image(
    image_bytes: bytes, patient_context: dict[str, Any] | None = None
) -> dict:
    extracted_text = await extract_text_from_image(image_bytes)
    if not extracted_text:
        return {
            "extracted_text": "",
            "medicines": [],
            "notes": "No readable text found in prescription image.",
        }

    try:
        llm = get_chat_model(temperature=0.3)
        chain = PRESCRIPTION_PROMPT | llm.with_structured_output(PrescriptionAnalysisOutput)
        result = await chain.ainvoke(
            {"text": extracted_text, "patient_context": patient_context or {}}
        )

        payload = result.model_dump()
        payload["extracted_text"] = extracted_text
        return payload
    except Exception as exc:
        logger.warning("Prescription LLM extraction unavailable: %s", exc)
        return {
            "extracted_text": extracted_text,
            "medicines": [],
            "notes": "OCR completed, but AI medicine extraction is temporarily unavailable.",
        }
