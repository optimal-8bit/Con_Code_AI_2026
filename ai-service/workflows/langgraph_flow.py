from __future__ import annotations

from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from agents.chat_agent import health_chat
from agents.symptom_agent import analyze_symptoms


class HealthWorkflowState(TypedDict, total=False):
    patient_id: str
    patient_context: dict[str, Any]
    symptom_text: str
    report_result: dict[str, Any]
    chat_message: str
    symptom_result: dict[str, Any]
    chat_result: dict[str, Any]


async def _symptom_node(state: HealthWorkflowState) -> HealthWorkflowState:
    symptom_text = (state.get("symptom_text") or "").strip()
    if not symptom_text:
        return {"symptom_result": {}}

    symptom_result = await analyze_symptoms(
        symptom_text,
        patient_context=state.get("patient_context") or {},
    )
    return {"symptom_result": symptom_result}


async def _report_node(state: HealthWorkflowState) -> HealthWorkflowState:
    report_result = state.get("report_result") or {}
    return {"report_result": report_result}


async def _chat_node(state: HealthWorkflowState) -> HealthWorkflowState:
    chat_message = (state.get("chat_message") or "").strip()
    if not chat_message:
        return {"chat_result": {"response": "", "suggested_next_steps": []}}

    contexts = {
        "symptom": state.get("symptom_result") or {},
        "report": state.get("report_result") or {},
    }

    chat_result = await health_chat(
        message=chat_message,
        history=[],
        contexts=contexts,
        rag_context="",
        patient_context=state.get("patient_context") or {},
    )
    return {"chat_result": chat_result}


def build_health_workflow():
    graph = StateGraph(HealthWorkflowState)

    graph.add_node("symptom", _symptom_node)
    graph.add_node("report", _report_node)
    graph.add_node("chat", _chat_node)

    graph.add_edge(START, "symptom")
    graph.add_edge("symptom", "report")
    graph.add_edge("report", "chat")
    graph.add_edge("chat", END)

    return graph.compile()


health_workflow = build_health_workflow()


async def run_health_workflow(
    *,
    patient_id: str,
    symptom_text: str,
    chat_message: str,
    report_result: dict[str, Any] | None = None,
    patient_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    result = await health_workflow.ainvoke(
        {
            "patient_id": patient_id,
            "patient_context": patient_context or {},
            "symptom_text": symptom_text,
            "chat_message": chat_message,
            "report_result": report_result or {},
        }
    )

    return {
        "symptom_result": result.get("symptom_result", {}),
        "report_result": result.get("report_result", {}),
        "chat_result": result.get("chat_result", {}),
    }
