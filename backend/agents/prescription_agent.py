from typing import TypedDict

from langgraph.graph import StateGraph, END

from app.services.llm_service import llm_service
from agents.base_agent import GraphAgent


class PrescriptionState(TypedDict, total=False):
    prescription_text: str
    image_description: str
    merged_text: str
    output: dict


class PrescriptionAnalyzerAgent(GraphAgent):
    def _build_graph(self):
        graph = StateGraph(PrescriptionState)
        graph.add_node("prepare_text", self._prepare_text)
        graph.add_node("extract", self._extract)
        graph.set_entry_point("prepare_text")
        graph.add_edge("prepare_text", "extract")
        graph.add_edge("extract", END)
        return graph.compile()

    def _prepare_text(self, state: PrescriptionState) -> PrescriptionState:
        merged = "\n".join(
            [
                f"Prescription Text: {state.get('prescription_text', '')}",
                f"Image Description/OCR: {state.get('image_description', '')}",
            ]
        )
        return {"merged_text": merged}

    def _extract(self, state: PrescriptionState) -> PrescriptionState:
        fallback = {
            "medicines": [
                {
                    "name": "Unknown medicine",
                    "dosage": "Consult doctor",
                    "frequency": "Consult doctor",
                    "duration": "Consult doctor",
                    "instructions": "Prescription unclear. Please verify with pharmacist.",
                }
            ],
            "summary_instructions": ["Please confirm all medicine details with a licensed doctor or pharmacist."],
        }
        result = llm_service.invoke_json(
            "You extract structured prescription data for patient-safe instructions.",
            "Extract medicines into JSON with keys: medicines (array of name, dosage, frequency, duration, instructions), summary_instructions (array).\n\n"
            + state.get("merged_text", ""),
            fallback,
        )
        return {"output": result}
