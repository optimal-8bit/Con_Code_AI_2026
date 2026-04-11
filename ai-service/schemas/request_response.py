from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class APIResponse(BaseModel):
    status: Literal["success", "error"]
    data: dict[str, Any] = Field(default_factory=dict)
    message: str | None = None


class SymptomCheckRequest(BaseModel):
    patient_id: str = Field(default="anonymous", min_length=1)
    text: str = Field(..., min_length=3, description="Patient symptoms in plain text")


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    patient_id: str = Field(default="anonymous", min_length=1)
    message: str = Field(..., min_length=1)
    history: list[ChatTurn] = Field(default_factory=list)
    contexts: dict[str, Any] = Field(default_factory=dict)
    rag_context: str | None = None

    use_workflow: bool = False
    symptom_text: str | None = None
    report_result: dict[str, Any] | None = None


class MedicineReminderInput(BaseModel):
    medicine_name: str = Field(..., min_length=1)
    dosage: str | None = None
    timings: list[str] = Field(default_factory=list)
    instructions: str | None = None


class ReminderRequest(BaseModel):
    patient_id: str = Field(default="anonymous", min_length=1)
    medicines: list[MedicineReminderInput] = Field(..., min_length=1)
    timezone: str = "UTC"
