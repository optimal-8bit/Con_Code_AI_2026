from __future__ import annotations

from typing import Any

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from config.settings import get_chat_model
from rag.loader import load_pdf_documents
from rag.retriever import retrieve_patient_context, store_patient_embeddings


class ReportExplanationOutput(BaseModel):
    abnormal_values: list[str] = Field(default_factory=list)
    explanation: str
    recommended_action: str


REPORT_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a medical report explainer for patients. Keep language simple and clear. "
            "Do not provide diagnosis. Flag uncertainty clearly.",
        ),
        (
            "human",
            "Patient context:\n{patient_context}\n\n"
            "Question: {question}\n\n"
            "Relevant report content:\n{context}\n\n"
            "Return abnormal values, plain-language explanation, and recommended next action.",
        ),
    ]
)


async def explain_report(
    file_bytes: bytes,
    *,
    patient_id: str,
    question: str | None = None,
    patient_context: dict[str, Any] | None = None,
) -> dict:
    user_question = question or "Explain abnormal values and what the patient should do next."

    documents = await load_pdf_documents(file_bytes)
    if not documents:
        return {
            "abnormal_values": [],
            "explanation": "No readable text was found in the uploaded report.",
            "recommended_action": "Upload a clearer PDF or consult your clinician.",
            "context_chunks": 0,
        }

    report_ref = f"{patient_id}:{abs(hash(file_bytes[:128]))}"
    await store_patient_embeddings(patient_id, report_ref, documents)
    retrieved_docs = await retrieve_patient_context(patient_id, user_question, k=5)

    if not retrieved_docs:
        retrieved_docs = documents[:5]

    context = "\n\n".join(doc.page_content for doc in retrieved_docs)

    llm = get_chat_model(temperature=0.3)
    chain = REPORT_PROMPT | llm.with_structured_output(ReportExplanationOutput)
    result = await chain.ainvoke(
        {
            "question": user_question,
            "context": context,
            "patient_context": patient_context or {},
        }
    )

    payload = result.model_dump()
    payload["context_chunks"] = len(retrieved_docs)
    return payload
