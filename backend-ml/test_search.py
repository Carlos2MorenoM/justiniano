# backend-ml/test_search.py
"""
RAG Verification Script.

This script performs an end-to-end test of the Retrieval-Augmented Generation (RAG)
pipeline's retrieval component. It:
1. Generates an embedding for a sample query using the local CPU/GPU.
2. Queries the local Qdrant instance for similar vectors.
3. Prints the results to verify that semantic search is working.

Usage:
    python test_search.py
"""

import time
import logging
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

# --- Configuration ---
# The query to test. Change this string to test different legal concepts.
QUERY = "subvenciones para placas solares fotovoltaicas" 
COLLECTION_NAME = "boe_legal_docs"
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
log = logging.getLogger(__name__)

def test_search():
    """
    Executes the search test pipeline.
    """
    log.info(f"--- Starting RAG Search Test ---")
    log.info(f"Query: '{QUERY}'")

    # 1. Load the Embedding Model
    # This runs locally. It requires the same model used for indexing (BGE-M3).
    log.info("\n1. Loading embedding model (BGE-M3)...")
    try:
        model = SentenceTransformer('BAAI/bge-m3')
    except Exception as e:
        log.error(f"Failed to load model. Do you have internet access to download it? Error: {e}")
        return

    # 2. Generate Query Vector
    log.info(f"2. Generating vector for query...")
    start_time = time.time()
    query_vector = model.encode(QUERY)
    duration = time.time() - start_time
    log.info(f"   -> Vector generated in {duration:.2f} seconds.")

    # 3. Search in Qdrant
    log.info(f"\n3. Searching in Qdrant ({QDRANT_HOST}:{QDRANT_PORT})...")
    try:
        client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        
        # Perform the search
        search_result = client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector, # El vector va aquí
            limit=5
        )
        hits = search_result.points # Los resultados están dentro de .points
    except Exception as e:
        log.error(f"Failed to connect or search in Qdrant. Is the container running? Error: {e}")
        return

    # 4. Display Results
    log.info("\n--- SEARCH RESULTS ---")
    if not hits:
        log.warning("No results found. Is the database empty?")
        return

    for i, hit in enumerate(hits):
        # The 'payload' contains the metadata we stored (e.g., original_id)
        doc_id = hit.payload.get('original_id', 'Unknown ID')
        score = hit.score
        log.info(f"#{i+1} | Score: {score:.4f} | ID: {doc_id}")

    log.info("\n--- Test Complete ---")

if __name__ == "__main__":
    test_search()
