from __future__ import annotations

import asyncio
import math

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from db.mongo import get_collection
from db.schemas import report_embedding_chunk_record
from rag.embedder import get_embeddings


def _split_documents(documents: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    return splitter.split_documents(documents)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return -1.0

    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))

    if norm_a == 0 or norm_b == 0:
        return -1.0

    return dot_product / (norm_a * norm_b)


def _store_patient_embeddings_sync(patient_id: str, report_ref: str, documents: list[Document]) -> int:
    if not documents:
        return 0

    chunks = _split_documents(documents)
    embeddings = get_embeddings()
    chunk_texts = [chunk.page_content for chunk in chunks]
    vectors = embeddings.embed_documents(chunk_texts)

    records: list[dict] = []
    for index, (chunk, vector) in enumerate(zip(chunks, vectors)):
        if not vector:
            continue
        records.append(
            report_embedding_chunk_record(
                patient_id=patient_id,
                report_ref=report_ref,
                chunk_index=index,
                chunk_text=chunk.page_content,
                embedding=[float(value) for value in vector],
                metadata=chunk.metadata,
            )
        )

    if not records:
        return 0

    collection = get_collection("reports")
    collection.insert_many(records)
    return len(records)


async def store_patient_embeddings(patient_id: str, report_ref: str, documents: list[Document]) -> int:
    return await asyncio.to_thread(_store_patient_embeddings_sync, patient_id, report_ref, documents)


def _retrieve_patient_context_sync(patient_id: str, query: str, k: int) -> list[Document]:
    if not query.strip():
        return []

    embeddings = get_embeddings()
    query_vector = [float(value) for value in embeddings.embed_query(query)]

    collection = get_collection("reports")
    records = list(
        collection.find(
            {"patient_id": patient_id, "record_type": "embedding_chunk"},
            {"chunk_text": 1, "embedding": 1, "metadata": 1},
        ).limit(600)
    )

    scored: list[tuple[float, dict]] = []
    for record in records:
        vector = record.get("embedding")
        if not isinstance(vector, list):
            continue
        score = _cosine_similarity(query_vector, [float(v) for v in vector])
        scored.append((score, record))

    if not scored:
        return []

    scored.sort(key=lambda item: item[0], reverse=True)
    top_records = [item[1] for item in scored[:k]]

    return [
        Document(
            page_content=str(record.get("chunk_text", "")),
            metadata=record.get("metadata") or {},
        )
        for record in top_records
        if str(record.get("chunk_text", "")).strip()
    ]


async def retrieve_patient_context(patient_id: str, query: str, k: int = 5) -> list[Document]:
    return await asyncio.to_thread(_retrieve_patient_context_sync, patient_id, query, k)
