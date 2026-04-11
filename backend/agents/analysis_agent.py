from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.services.llm_service import llm_service
from agents.base_agent import GraphAgent, TextRetrieval


class ReportState(TypedDict, total=False):
    report_text: str
    question: str
    patient_age: int
    patient_gender: str
    retrieved_context: str
    output: dict


class ReportExplainerAgent(GraphAgent):
    def _build_graph(self):
        graph = StateGraph(ReportState)
        graph.add_node("retrieve", self._retrieve)
        graph.add_node("explain", self._explain)
        graph.set_entry_point("retrieve")
        graph.add_edge("retrieve", "explain")
        graph.add_edge("explain", END)
        return graph.compile()

    def _retrieve(self, state: ReportState) -> ReportState:
        question = state.get("question", "Explain this report")
        report_text = state.get("report_text", "")
        chunks = TextRetrieval.retrieve(question, report_text, top_k=3)
        return {"retrieved_context": "\n\n".join(chunks)}

    def _explain(self, state: ReportState) -> ReportState:
        fallback = {
            "plain_language_summary": "Medical report received. Please consult a doctor for final interpretation.",
            "abnormalities": ["No validated abnormality extraction without LLM configuration"],
            "actionable_insights": ["Share report with doctor", "Track symptoms", "Repeat tests if advised"],
        }
        prompt = (
            f"Patient age: {state.get('patient_age', 'unknown')}\n"
            f"Patient gender: {state.get('patient_gender', 'unknown')}\n"
            f"Question: {state.get('question', 'Explain this report')}\n\n"
            f"Retrieved Context:\n{state.get('retrieved_context', '')}"
        )
        result = llm_service.invoke_json(
            "You explain health reports in plain language and highlight abnormalities safely.",
            "Return JSON with keys: plain_language_summary (string), abnormalities (array), actionable_insights (array).\n\n"
            + prompt,
            fallback,
        )
        return {"output": result}


AnalysisAgent = ReportExplainerAgent
