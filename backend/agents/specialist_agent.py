from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.services.llm_service import llm_service
from agents.base_agent import GraphAgent


class SpecialistState(TypedDict, total=False):
    role: str
    medical_report: str
    notes: str
    output: str


class DoctorSpecialistAgent(GraphAgent):
    def __init__(self, role: str):
        self.role = role
        super().__init__()

    def _build_graph(self):
        graph = StateGraph(SpecialistState)
        graph.add_node("review", self._review)
        graph.set_entry_point("review")
        graph.add_edge("review", END)
        return graph.compile()

    def _review(self, state: SpecialistState) -> SpecialistState:
        if not llm_service.enabled:
            return {
                "output": f"{self.role} review fallback: please configure GEMINI_API_KEY for detailed specialist analysis."
            }

        prompt = (
            f"Role: {self.role}\n"
            f"Medical Report: {state.get('medical_report', '')}\n"
            f"Additional Notes: {state.get('notes', '')}\n\n"
            "Return possible causes and recommended next steps."
        )
        result = llm_service.invoke(
            "You are a medical specialist assistant. Provide concise, clinically safe guidance.",
            prompt,
        )
        return {"output": result}


class MultidisciplinaryReviewerAgent(GraphAgent):
    def _build_graph(self):
        graph = StateGraph(dict)
        graph.add_node("synthesize", self._synthesize)
        graph.set_entry_point("synthesize")
        graph.add_edge("synthesize", END)
        return graph.compile()

    def _synthesize(self, state: dict) -> dict:
        cardio = state.get("cardiologist_report", "")
        psych = state.get("psychologist_report", "")
        pulm = state.get("pulmonologist_report", "")

        if not llm_service.enabled:
            return {
                "output": "Multidisciplinary fallback: combine specialist reports manually until LLM is configured."
            }

        prompt = (
            "Combine these specialist reports and return top 3 possible issues with reasons.\n\n"
            f"Cardiologist: {cardio}\n"
            f"Psychologist: {psych}\n"
            f"Pulmonologist: {pulm}"
        )
        return {
            "output": llm_service.invoke(
                "You are a multidisciplinary medical review board.",
                prompt,
            )
        }


class _LegacySpecialistWrapper:
    def __init__(self, role: str, medical_report: str):
        self.role = role
        self.medical_report = medical_report
        self._agent = DoctorSpecialistAgent(role)

    def run(self):
        result = self._agent.invoke({"medical_report": self.medical_report})
        return result.get("output", "")


class Cardiologist(_LegacySpecialistWrapper):
    def __init__(self, medical_report: str):
        super().__init__("Cardiologist", medical_report)


class Psychologist(_LegacySpecialistWrapper):
    def __init__(self, medical_report: str):
        super().__init__("Psychologist", medical_report)


class Pulmonologist(_LegacySpecialistWrapper):
    def __init__(self, medical_report: str):
        super().__init__("Pulmonologist", medical_report)