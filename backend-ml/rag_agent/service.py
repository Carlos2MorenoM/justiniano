"""
RAG Service Logic.

This module orchestrates the Retrieval-Augmented Generation flow:
1. Vectorizes the user query.
2. Searches Qdrant for relevant document chunks.
3. Constructs a prompt with the retrieved context.
4. Calls the appropriate Ollama model based on the user tier.
"""
import logging
from typing import List, Dict, Any, AsyncGenerator
import ollama
import os
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()
host = os.getenv("QDRANT_HOST", "VALOR_POR_DEFECTO")
print(f"DEBUG: Leyendo QDRANT_HOST del entorno: '{host}'")
log = logging.getLogger(__name__)

# --- Configuration ---
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
COLLECTION_NAME = "boe_legal_docs"

# Model Definitions
MODEL_FREE = "llama3.1:8b"
MODEL_PRO = "mistral-nemo"

class RagService:
    def __init__(self):
        """
        Initializes connections to the Vector DB and loads the Embedding Model.
        """
        log.info("Initializing RAG Service...")
        
        # 1. Connect to Qdrant
        self.qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        
        # 2. Load Embedding Model (BGE-M3)
        # Note: This loads into memory/GPU. In production, this might be a separate service.
        try:
            self.embedder = SentenceTransformer('BAAI/bge-m3')
            log.info("Embedding model loaded successfully.")
        except Exception as e:
            log.error(f"Failed to load embedding model: {e}")
            raise

    def _get_context(self, query: str, limit: int = 5) -> tuple[str, List[str]]:
        """
        Retrieves relevant context from Qdrant for a given query.

        Args:
            query: The user's question.
            limit: Number of chunks to retrieve.

        Returns:
            A tuple containing:
            - A single string with all concatenated text chunks.
            - A list of source document IDs.
        """
        log.info(f"🔍 Buscando en Qdrant para: '{query}'")
        
        # 1. Vectorize query
        query_vector = self.embedder.encode(query)

        # 2. Search Qdrant
        # TODO: Phase 4 - Connect to MongoDB or store text in Qdrant payload.
        
        # Let's assume for THIS STEP that we only get IDs. 
        # We will instruct the LLM to simulate knowledge or admit it needs the text source.
        hits = self.qdrant.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=limit
        ).points

        context_text = ""
        source_ids = []

        for hit in hits:
            doc_id = hit.payload.get('original_id', 'Unknown')
            source_ids.append(doc_id)
            # If we had text in payload: context_text += hit.payload.get('text', '') + "\n\n"
            # Since we don't, let's just list the sources for the LLM to reference.
            context_text += f"Document ID: {doc_id} (Relevant legal section)\n"

        return context_text, source_ids

    async def chat_stream(self, query: str, user_tier: str) -> AsyncGenerator[str, None]:
        """
        Generates a streaming response from the LLM using RAG.

        Args:
            query: The user's input.
            user_tier: 'free' or 'pro'. Determines the model used.
        """
        # 1. Select Model
        model_name = MODEL_PRO if user_tier == "pro" else MODEL_FREE
        log.info(f"Processing request with tier '{user_tier}'. Using model: {model_name}")

        # 2. Retrieve Context
        context_str, source_ids = self._get_context(query)
        
        # 3. Construct Prompt
        # We inject the context into the system prompt
        system_prompt = (
            "Eres Justiniano, un asistente legal experto en leyes españolas (BOE). "
            "Usa la siguiente información de contexto (referencias a documentos) para responder. "
            "Si no puedes responder con certeza, indícalo. "
            "Responde siempre en español profesional.\n\n"
            f"CONTEXTO DISPONIBLE:\n{context_str}"
        )

        # 4. Call Ollama (Streaming)
        stream = ollama.chat(
            model=model_name,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': query},
            ],
            stream=True,
        )

        # 5. Yield chunks
        for chunk in stream:
            yield chunk['message']['content']

# Singleton instance to avoid reloading the model on every request
rag_service = RagService()