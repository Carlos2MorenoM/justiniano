# backend-ml/data_processing/load_vectordb.py
"""
Vector Database Loader Script.

This module is responsible for:
1. Reading the batched embedding files (.npy) and metadata (.json) from Colab.
2. Re-constructing the text mapping from the original JSONL files.
3. Loading vectors AND text content into the local Qdrant vector database.

It handles:
- Connection to the Qdrant instance.
- Initialization of the vector collection.
- Text re-processing for "monster chunks" to ensure ID alignment.
- robust iteration over batch files with error handling.
"""

import os
import json
import logging
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.http import models
from tqdm import tqdm
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter

# --- Configuration ---
load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
log = logging.getLogger(__name__)

# Paths
# Resolves to backend-ml/data/
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
OUTPUTS_DIR = os.path.join(DATA_DIR, 'outputs')
CHUNKS_FILE = os.path.join(DATA_DIR, 'knowledge_chunks.jsonl')
# The monster file is expected to be inside outputs/ or data/ depending on where you saved it
MONSTER_FILE = os.path.join(OUTPUTS_DIR, 'monster_chunks_to_fix.jsonl')

# Qdrant Configuration
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
COLLECTION_NAME = "boe_legal_docs"
VECTOR_SIZE = 1024 # Matches BGE-M3 output dimension


def load_text_mapping() -> dict:
    """
    Creates a comprehensive dictionary mapping chunk_ids to their actual text content.
    
    This function:
    1. Reads the standard 'knowledge_chunks.jsonl'.
    2. Reads and re-splits the 'monster_chunks_to_fix.jsonl' to reproduce
       the exact sub-chunks generated in the Colab pipeline.
    
    Returns:
        dict: A map where keys are chunk IDs (str) and values are the text content (str).
    """
    text_map = {}
    
    # 1. Load Normal Chunks
    if os.path.exists(CHUNKS_FILE):
        log.info(f"Loading standard text chunks from {CHUNKS_FILE}...")
        with open(CHUNKS_FILE, 'r', encoding='utf-8') as f:
            for line in tqdm(f, desc="Indexing normal text"):
                try:
                    data = json.loads(line)
                    text_map[data['chunk_id']] = data['text']
                except json.JSONDecodeError:
                    continue
    else:
        log.error(f"File not found: {CHUNKS_FILE}. Make sure to run 'dvc pull'.")

    # 2. Load and Re-process Monster Chunks
    # We must use the EXACT same splitting logic used in Colab to ensure IDs match.
    if os.path.exists(MONSTER_FILE):
        log.info(f"Re-processing monster chunks from {MONSTER_FILE}...")
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )
        
        with open(MONSTER_FILE, 'r', encoding='utf-8') as f:
            for line in tqdm(f, desc="Indexing monster text"):
                try:
                    data = json.loads(line)
                    original_text = data.get('text', '')
                    doc_id = data.get('doc_id', 'unknown')
                    
                    # Reproduce the splitting logic
                    sub_chunks = text_splitter.split_text(original_text)
                    
                    for i, sub_text in enumerate(sub_chunks):
                        # Re-construct the ID used in Colab
                        sub_id = f"{doc_id}_monster_sub_{i}"
                        text_map[sub_id] = sub_text
                except json.JSONDecodeError:
                    continue
    else:
        log.warning(f"Monster chunks file not found at {MONSTER_FILE}. Skipping monster text mapping.")
    
    return text_map


def init_collection(client: QdrantClient):
    """
    Initializes the Qdrant collection if it does not already exist.

    Args:
        client (QdrantClient): The authenticated Qdrant client instance.
    """
    try:
        client.get_collection(COLLECTION_NAME)
        log.info(f"Collection '{COLLECTION_NAME}' already exists.")
    except Exception:
        log.info(f"Collection '{COLLECTION_NAME}' not found. Creating it...")
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=VECTOR_SIZE, 
                distance=models.Distance.COSINE
            ),
            # Optimization for bulk loading
            optimizers_config=models.OptimizersConfigDiff(
                memmap_threshold=20000
            )
        )
        log.info(f"Collection '{COLLECTION_NAME}' created successfully.")


def load_data():
    """
    Main execution function.
    
    1. Builds the text mapping in memory.
    2. Iterates through the 'outputs' directory.
    3. Pairs .npy vector files with their .json ID files.
    4. Injects the text payload.
    5. Performs bulk uploads to Qdrant.
    """
    # 1. Build Text Index
    text_lookup = load_text_mapping()
    log.info(f"Text mapping complete. Loaded {len(text_lookup)} documents into memory.")

    # 2. Connect to Qdrant
    try:
        client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        init_collection(client)
    except Exception as e:
        log.error(f"Failed to connect to Qdrant at {QDRANT_HOST}:{QDRANT_PORT}. Is the container running? Error: {e}")
        return

    # 3. Locate batch files
    if not os.path.exists(OUTPUTS_DIR):
        log.error(f"Outputs directory not found at {OUTPUTS_DIR}. Please download the data first.")
        return

    files = [f for f in os.listdir(OUTPUTS_DIR) if f.endswith('_vectors.npy')]
    log.info(f"Found {len(files)} batch files to upload in {OUTPUTS_DIR}.")

    total_uploaded = 0

    # 4. Process each batch
    for vector_file in tqdm(files, desc="Uploading batches"):
        # Construct file paths
        # Expected format: "batch_0_vectors.npy" -> base_name: "batch_0"
        base_name = vector_file.replace('_vectors.npy', '')
        ids_file = f"{base_name}_ids.json"
        
        vec_path = os.path.join(OUTPUTS_DIR, vector_file)
        ids_path = os.path.join(OUTPUTS_DIR, ids_file)

        # Validate pair existence
        if not os.path.exists(ids_path):
            log.warning(f"Missing corresponding IDs file for {vector_file}. Skipping batch.")
            continue

        # Load data from disk
        try:
            vectors = np.load(vec_path)
            with open(ids_path, 'r', encoding='utf-8') as f:
                chunk_ids = json.load(f)
        except Exception as e:
            log.error(f"Error reading files for {base_name}: {e}")
            continue

        # Validate data integrity
        if len(vectors) != len(chunk_ids):
            log.error(f"Data mismatch in {base_name}: {len(vectors)} vectors vs {len(chunk_ids)} IDs. Skipping.")
            continue

        # Prepare Payload (Points)
        points = []
        for i, chunk_id in enumerate(chunk_ids):
            # Retrieve the text from our lookup map
            real_text = text_lookup.get(chunk_id, "Text content not found during sync.")
            
            points.append(models.PointStruct(
                id=i + total_uploaded, 
                vector=vectors[i].tolist(),
                payload={
                    "original_id": chunk_id,
                    "text": real_text  # <-- Text Injection
                } 
            ))

        # Upload to Qdrant
        try:
            client.upsert(
                collection_name=COLLECTION_NAME,
                points=points
            )
            total_uploaded += len(points)
        except Exception as e:
            log.error(f"Failed to upload batch {base_name} to Qdrant: {e}")

    log.info("="*50)
    log.info(f"Upload process completed successfully.")
    log.info(f"Total vectors indexed with text: {total_uploaded}")
    log.info("="*50)

if __name__ == "__main__":
    load_data()
