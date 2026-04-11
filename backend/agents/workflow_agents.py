from typing import TypedDict

from langgraph.graph import StateGraph, END

from app.services.llm_service import llm_service
from agents.base_agent import GraphAgent


class DashboardState(TypedDict, total=False):
    stakeholder_id: str
    profile: dict
    records: list[dict]
    summary: str
    output: dict


class _DashboardBaseAgent(GraphAgent):
    role_name: str = "Stakeholder"

    def _build_graph(self):
        graph = StateGraph(DashboardState)
        graph.add_node("summarize", self._summarize)
        graph.add_node("plan_actions", self._plan_actions)
        graph.set_entry_point("summarize")
        graph.add_edge("summarize", "plan_actions")
        graph.add_edge("plan_actions", END)
        return graph.compile()

    def _summarize(self, state: DashboardState) -> DashboardState:
        summary = (
            f"Role: {self.role_name}\n"
            f"Stakeholder ID: {state.get('stakeholder_id', '')}\n"
            f"Profile: {state.get('profile', {})}\n"
            f"Records: {state.get('records', [])}"
        )
        return {"summary": summary}

    def _plan_actions(self, state: DashboardState) -> DashboardState:
        fallback = {
            "summary": f"{self.role_name} dashboard summary generated.",
            "action_items": [
                "Review pending records",
                "Resolve urgent alerts",
                "Coordinate with connected stakeholders",
            ],
        }
        result = llm_service.invoke_json(
            f"You are an AI copilot for the {self.role_name} dashboard in a healthcare platform.",
            "Produce JSON with keys summary (string) and action_items (array of short actions).\n\n"
            + state.get("summary", ""),
            fallback,
        )
        return {"output": result}


class PatientDashboardAgent(_DashboardBaseAgent):
    role_name = "Patient"


class DoctorDashboardAgent(_DashboardBaseAgent):
    role_name = "Doctor"


class PharmacyDashboardAgent(_DashboardBaseAgent):
    role_name = "Pharmacy"
