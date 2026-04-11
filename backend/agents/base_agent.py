from typing import TypedDict

from langgraph.graph import StateGraph, END


class GraphAgent:
    def __init__(self) -> None:
        self.graph = self._build_graph()

    def _build_graph(self):
        raise NotImplementedError

    def invoke(self, payload: dict):
        return self.graph.invoke(payload)


class TextRetrieval:
    @staticmethod
    def split_chunks(text: str, chunk_size: int = 400) -> list[str]:
        words = text.split()
        if not words:
            return []
        chunks = []
        for i in range(0, len(words), chunk_size):
            chunks.append(" ".join(words[i : i + chunk_size]))
        return chunks

    @staticmethod
    def retrieve(query: str, corpus_text: str, top_k: int = 3) -> list[str]:
        chunks = TextRetrieval.split_chunks(corpus_text)
        if not chunks:
            return []

        query_terms = set(query.lower().split())
        ranked = []
        for chunk in chunks:
            terms = set(chunk.lower().split())
            score = len(query_terms.intersection(terms))
            ranked.append((score, chunk))

        ranked.sort(key=lambda item: item[0], reverse=True)
        return [chunk for score, chunk in ranked[:top_k] if score > 0] or chunks[:1]
