from __future__ import annotations

from typing import Any

from langchain.memory import ConversationBufferMemory
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from config.settings import get_chat_model


class ChatAssistantOutput(BaseModel):
    response: str
    suggested_next_steps: list[str] = Field(default_factory=list)


CHAT_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a healthcare chat assistant for a patient dashboard. "
            "Use provided context, stay conservative, and avoid definitive diagnosis.",
        ),
        (
            "human",
            "Patient context:\n{patient_context}\n\n"
            "Conversation history:\n{chat_history}\n\n"
            "Structured context from other agents:\n{agent_context}\n\n"
            "RAG context:\n{rag_context}\n\n"
            "User message:\n{message}",
        ),
    ]
)


def _build_history_text(history: list[dict[str, str]]) -> str:
    memory = ConversationBufferMemory(return_messages=True)

    for item in history:
        role = item.get("role", "user")
        content = item.get("content", "").strip()
        if not content:
            continue
        if role == "assistant":
            memory.chat_memory.add_message(AIMessage(content=content))
        else:
            memory.chat_memory.add_message(HumanMessage(content=content))

    loaded = memory.load_memory_variables({})
    messages = loaded.get("history", [])
    lines: list[str] = []

    for message in messages:
        prefix = "Assistant" if isinstance(message, AIMessage) else "User"
        lines.append(f"{prefix}: {message.content}")

    return "\n".join(lines)


async def health_chat(
    *,
    message: str,
    history: list[dict[str, str]] | None = None,
    contexts: dict[str, Any] | None = None,
    rag_context: str | None = None,
    patient_context: dict[str, Any] | None = None,
) -> dict:
    chat_history = _build_history_text(history or [])

    llm = get_chat_model(temperature=0.3)
    chain = CHAT_PROMPT | llm.with_structured_output(ChatAssistantOutput)

    result = await chain.ainvoke(
        {
            "patient_context": patient_context or {},
            "chat_history": chat_history or "No prior conversation.",
            "agent_context": contexts or {},
            "rag_context": rag_context or "No RAG context provided.",
            "message": message,
        }
    )
    return result.model_dump()
