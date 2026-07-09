"""
mock_chroma.py — A lightweight, dependency-free replacement for ChromaDB.

Since we only have a handful of documents per case, we don't need a real
vector database. This mock simply stores documents in memory and uses
basic word-overlap (Jaccard-like) scoring to "retrieve" the most relevant
documents for a query.
"""

import re
from collections import defaultdict

class MockCollection:
    def __init__(self, name: str):
        self.name = name
        self.documents = []  # list of strings
        self.metadatas = []  # list of dicts
        self.ids = []        # list of strings

    def upsert(self, ids: list[str], documents: list[str], metadatas: list[dict]):
        for i, doc_id in enumerate(ids):
            # If exists, update
            if doc_id in self.ids:
                idx = self.ids.index(doc_id)
                self.documents[idx] = documents[i]
                self.metadatas[idx] = metadatas[i]
            else:
                self.ids.append(doc_id)
                self.documents.append(documents[i])
                self.metadatas.append(metadatas[i])

    def query(self, query_texts: list[str], n_results: int = 1, where: dict = None, include: list = None):
        """Mock query using simple keyword overlap."""
        query_text = query_texts[0].lower()
        query_words = set(re.findall(r'\w+', query_text))
        
        # Filter by metadata (mystery_id)
        candidates = []
        for i, doc_id in enumerate(self.ids):
            if where:
                match = True
                for k, v in where.items():
                    if self.metadatas[i].get(k) != v:
                        match = False
                        break
                if not match:
                    continue
            
            # Score candidate based on word overlap
            # Score candidate based on word overlap
            doc_words = set(re.findall(r'\w+', self.documents[i].lower()))

            
            # Simple score: number of intersecting words
            overlap = len(query_words.intersection(doc_words))
            candidates.append((overlap, i))
            
        # Sort by score descending
        candidates.sort(key=lambda x: x[0], reverse=True)
        
        # Take top n_results
        top_k = candidates[:n_results]
        
        # Format like ChromaDB response
        return {
            "ids": [[self.ids[idx] for score, idx in top_k]],
            "documents": [[self.documents[idx] for score, idx in top_k]],
            "metadatas": [[self.metadatas[idx] for score, idx in top_k]],
            "distances": [[-score for score, idx in top_k]] # Fake distance (lower is better)
        }


_GLOBAL_COLLECTIONS = {}

class Client:
    def __init__(self):
        pass

    def get_or_create_collection(self, name: str, metadata: dict = None):
        if name not in _GLOBAL_COLLECTIONS:
            _GLOBAL_COLLECTIONS[name] = MockCollection(name)
        return _GLOBAL_COLLECTIONS[name]

