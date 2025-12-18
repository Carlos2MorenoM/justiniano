"""
RAG Service Logic (Cloud Adapted).

This module orchestrates the Retrieval-Augmented Generation flow:
1. Vectorizes the user query using a local embedding model (SentenceTransformer).
2. Searches Qdrant (Cloud or Local) for relevant document chunks.
3. Constructs a prompt with the retrieved context.
4. Calls Groq (Llama 3.3) for high-performance cloud inference.
"""
import logging
import os
from typing import List, Dict, Any, AsyncGenerator
from groq import Groq
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Configuration ---
# Qdrant Configuration (Supports both Local Docker and Cloud)
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None) # Added for Cloud Support
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
COLLECTION_NAME = "boe_legal_docs"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Groq Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
log = logging.getLogger(__name__)

class RagService:
    def __init__(self):
        """
        Initializes connections to the Vector DB, loads the Embedding Model,
        and sets up the Groq Cloud Client.
        """
        log.info("Initializing RAG Service (Cloud Hybrid Mode)...")
        
        # 1. Connect to Qdrant
        # Logic adapted to support Qdrant Cloud (requires API Key) vs Local
        
        # Sanitize inputs to prevent "invalid Header" errors
        host = QDRANT_HOST.strip()
        port = int(QDRANT_PORT)
        
        # Ensure API Key is clean (no newlines/spaces) if present
        api_key = QDRANT_API_KEY.strip() if QDRANT_API_KEY else None
        if api_key == "":
            api_key = None
            
        # Mask API key for logging
        masked_key = f"{api_key[:4]}...{api_key[-4:]}" if api_key and len(api_key) > 8 else ("Present" if api_key else "None")
        log.info(f"Connecting to Qdrant: {host} (Port: {port}, API Key: {masked_key})")

        if host.startswith("http"):
            # Cloud or explicit URL
            self.qdrant = QdrantClient(
                url=host, 
                api_key=api_key
            )
        else:
            # Local or Hostname only
            # Force https=False to prevent SSL errors if api_key is present (which defaults https to True)
            self.qdrant = QdrantClient(
                host=host, 
                port=port, 
                api_key=api_key,
                https=False
            )
        
        # 2. Load Embedding Model
        try:
            log.info("Loading Embedding Model (BAAI/bge-m3)...")
            self.embedder = SentenceTransformer('BAAI/bge-m3')
            log.info("Embedding model loaded successfully.")
        except Exception as e:
            log.error(f"Failed to load embedding model: {e}")
            raise

        # 3. Initialize Groq Client
        if not GROQ_API_KEY:
            log.warning("GROQ_API_KEY not found. Inference will fail.")
        self.groq_client = Groq(api_key=GROQ_API_KEY)
        self.model_name = GROQ_MODEL # Standardizing on the best model for now

    def _get_context(self, query: str, limit: int = 5) -> tuple[str, List[str]]:
        """
        Retrieves relevant context from Qdrant using the local embedder.
        """
        log.info(f"🔍 Searching Qdrant for: '{query}'")

        # 1. Vectorize query (Local CPU)
        try:
            query_vector = self.embedder.encode(query)
        except Exception as e:
            log.error(f"Embedding encoding failed: {e}")
            return "", []

        # 2. Search Qdrant (Cloud/Local Network)
        try:
            hits = self.qdrant.query_points(
                collection_name=COLLECTION_NAME,
                query=query_vector,
                limit=limit
            ).points
        except Exception as e:
            log.error(f"Qdrant search failed: {e}")
            # Fail gracefully so the chat can continue without context if DB is down
            return "No se pudo acceder a la base de datos legal.", []

        context_text = ""
        source_ids = []

        for hit in hits:
            doc_id = hit.payload.get('original_id', 'Unknown')
            doc_text = hit.payload.get('text', 'Content Not Available.')
            source_ids.append(doc_id)
            
            score = hit.score
            # log.info(f"   -> Hit: {doc_id} (Score: {score:.4f})")

            context_text += f"--- Documento: {doc_id} (Relevancia: {score:.2f}) ---\n"
            context_text += f"{doc_text}\n\n"

        return context_text, source_ids

    async def chat_stream(self, query: str, history: List[Dict[str, Any]], user_tier: str) -> AsyncGenerator[str, None]:
        """
        Generates a streaming response using Groq Cloud Inference + Qdrant Context.
        """
        # 1. Retrieve Context
        context_str, source_ids = self._get_context(query)
        
        # 2. Construct System Prompt
        system_prompt = (
            "Eres Justiniano, un asistente legal experto en leyes españolas (BOE). "
            "Usa la siguiente información de contexto (referencias a documentos) para responder. "
            "Si no puedes responder con certeza, indícalo. "
            "Responde siempre en español profesional.\n\n"
            "No pases de los 12000 tokens en la respuesta."
            f"CONTEXTO DISPONIBLE:\n{context_str}"
        )

        # 3. Build Messages Payload for Groq
        messages_payload = [{'role': 'system', 'content': system_prompt}]
        
        # Add limited history to conserve context window
        if history:
            # Take only the last 4 messages to avoid overflowing tokens or confusing the model
            messages_payload.extend(history[-4:])

        messages_payload.append({'role': 'user', 'content': query})

        # 4. Call Groq API (Streaming)
        try:
            stream = self.groq_client.chat.completions.create(
                model=self.model_name,
                messages=messages_payload,
                temperature=0.3, # Low temp for factual responses
                max_tokens=1024,
                stream=True,
                stop=None
            )

            # 5. Yield chunks
            for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content

        except Exception as e:
            log.error(f"Groq Inference Error: {e}")
            yield f"Error del sistema: No se pudo conectar con el motor de IA. ({str(e)})"

# Singleton instance
rag_service = RagService()