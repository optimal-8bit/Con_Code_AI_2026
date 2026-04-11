from typing import TypedDict

from langgraph.graph import StateGraph, END

from app.services.llm_service import llm_service
from agents.base_agent import GraphAgent


class SymptomState(TypedDict, total=False):
    symptom_text: str
    voice_transcript: str
    image_description: str
    patient_age: int
    patient_gender: str
    known_conditions: list[str]
    unified_input: str
    output: dict


class MultimodalSymptomCheckerAgent(GraphAgent):
    def _build_graph(self):
        graph = StateGraph(SymptomState)
        graph.add_node("merge_inputs", self._merge_inputs)
        graph.add_node("predict", self._predict)
        graph.set_entry_point("merge_inputs")
        graph.add_edge("merge_inputs", "predict")
        graph.add_edge("predict", END)
        return graph.compile()

    def _merge_inputs(self, state: SymptomState) -> SymptomState:
        unified = "\n".join(
            [
                f"Symptoms Text: {state.get('symptom_text', '')}",
                f"Voice Transcript: {state.get('voice_transcript', '')}",
                f"Image Description: {state.get('image_description', '')}",
                f"Patient Age: {state.get('patient_age', 'unknown')}",
                f"Patient Gender: {state.get('patient_gender', 'unknown')}",
                f"Known Conditions: {', '.join(state.get('known_conditions', []))}",
            ]
        )
        return {"unified_input": unified}

    def _predict(self, state: SymptomState) -> SymptomState:
        fallback = {
            "possible_conditions": ["Needs clinical assessment"],
            "severity": "moderate",
            "next_steps": [
                "Book a doctor consultation",
                "Track symptoms for 24 hours",
                "Go to emergency care for severe worsening",
            ],
            "disclaimer": "AI triage is supportive only and not a final diagnosis.",
        }
        result = llm_service.invoke_json(
            "You are a medical triage assistant. Return safe, conservative output.",
            "Analyze this multimodal symptom input and return JSON with keys: possible_conditions (array), severity (low|moderate|high|critical), next_steps (array), disclaimer (string).\n\n"
            + state.get("unified_input", ""),
            fallback,
        )
        return {"output": result}
