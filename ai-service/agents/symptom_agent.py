from __future__ import annotations

from typing import Any, Literal

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from config.settings import get_chat_model


class SymptomAssessmentOutput(BaseModel):
    possible_conditions: list[str] = Field(default_factory=list)
    severity: Literal["low", "medium", "high"]
    recommended_action: str


SYMPTOM_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a healthcare triage assistant. Analyze symptoms conservatively and avoid making definitive diagnoses. "
            "Return concise output suitable for a patient dashboard.",
        ),
        (
            "human",
            "Patient context:\n{patient_context}\n\n"
            "Symptoms: {symptoms}\n\n"
            "Identify possible conditions, estimate severity (low/medium/high), and recommend next action."
            " Keep advice medically safe and practical.",
        ),
    ]
)


async def analyze_symptoms(symptoms: str, patient_context: dict[str, Any] | None = None) -> dict:
    llm = get_chat_model(temperature=0.3)
    chain = SYMPTOM_PROMPT | llm.with_structured_output(SymptomAssessmentOutput)
    result = await chain.ainvoke({"symptoms": symptoms, "patient_context": patient_context or {}})
    return result.model_dump()
