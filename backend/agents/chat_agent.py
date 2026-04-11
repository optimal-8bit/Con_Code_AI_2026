from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.services.llm_service import llm_service
from agents.base_agent import GraphAgent, TextRetrieval


class ChatState(TypedDict, total=False):
    question: str
    report_context: str
    chat_history: list[dict]
    retrieved_context: str
    answer: str


class SmartHealthChatAgent(GraphAgent):
    def _build_graph(self):
        graph = StateGraph(ChatState)
        graph.add_node("retrieve", self._retrieve)
        graph.add_node("generate_answer", self._answer)
        graph.set_entry_point("retrieve")
        graph.add_edge("retrieve", "generate_answer")
        graph.add_edge("generate_answer", END)
        return graph.compile()

    def _retrieve(self, state: ChatState) -> ChatState:
        docs = TextRetrieval.retrieve(
            state.get("question", ""),
            state.get("report_context", ""),
            top_k=3,
        )
        return {"retrieved_context": "\n\n".join(docs)}

    def _answer(self, state: ChatState) -> ChatState:
        if not llm_service.enabled:
            return {"answer": self._offline_answer(state)}

        history_text = "\n".join(
            [f"{m.get('role', 'user')}: {m.get('content', '')}" for m in state.get("chat_history", [])[-6:]]
        )
        user_prompt = (
            f"Chat History:\n{history_text}\n\n"
            f"Context:\n{state.get('retrieved_context', '')}\n\n"
            f"Question:\n{state.get('question', '')}\n\n"
            "Answer in max 5 sentences and include a safety disclaimer when needed."
        )
        try:
            answer = llm_service.invoke(
                "You are a smart health assistant for patients, doctors, and pharmacies.",
                user_prompt,
            )
        except Exception:
            answer = self._offline_answer(state)
        return {"answer": answer}

    def _offline_answer(self, state: ChatState) -> str:
        question = (state.get("question") or "").strip()
        context = (state.get("retrieved_context") or "").strip()

        if context:
            snippet = " ".join(context.split())
            if len(snippet) > 420:
                snippet = snippet[:420].rstrip() + "..."
            return (
                f"I cannot use the cloud model right now, but based on your shared report context: {snippet} "
                f"For your question \"{question or 'this'}\", please confirm this with a licensed clinician before making treatment changes."
            )

        return (
            "I do not have enough report context to answer confidently in offline mode. "
            "Please share relevant findings (for example CBC, liver panel, glucose, creatinine, or symptoms timeline), "
            "and seek urgent care for severe pain, breathing issues, confusion, or chest pain."
        )


ChatAgent = SmartHealthChatAgent
