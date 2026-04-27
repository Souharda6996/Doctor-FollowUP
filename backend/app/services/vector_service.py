from sentence_transformers import SentenceTransformer
from app.database import supabase
from typing import List, Dict
import numpy as np

class VectorService:
    def __init__(self):
        print("💡 Loading local Embedding Model (SentenceTransformer)...")
        # Loads all-MiniLM-L6-v2 (384-dimensional)
        # This will download the model on the first run (~80MB)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Embedding Model ready.")

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates a 384-dimensional vector embedding for the given text.
        """
        if not text:
            return [0.0] * 384
        
        embedding = self.model.encode(text)
        return embedding.tolist()

    async def match_remedies(
        self,
        query_text: str,
        top_k: int = 5,
        threshold: float = 0.3
    ) -> List[Dict]:
        """
        Generates embedding for query_text and calls Postgres RPC for similarity search.
        """
        query_embedding = self.generate_embedding(query_text)
        
        result = supabase.rpc("match_remedies", {
            "query_embedding": query_embedding,
            "match_threshold": threshold,
            "match_count": top_k
        }).execute()
        
        return result.data if result.data else []

# Global instance
vector_service = VectorService()
