"""
Script for semantic chunking of raw BOE data.

Reads 'raw_data.jsonl' and splits each document's text based on
legal boundaries (Artículos, Disposiciones, etc.) into a new
'knowledge_chunks.jsonl' file, ready for embedding.
"""

import json
import logging
import re
from pathlib import Path
from typing import List, Dict, Any

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
log = logging.getLogger(__name__)

# --- Paths ---
# Resolves paths relative to this script's location
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
RAW_DATA_FILE = DATA_DIR / "raw_boe" / "raw_data.jsonl"
OUTPUT_FILE = DATA_DIR / "knowledge_chunks.jsonl"
PROCESSED_IDS_FILE = DATA_DIR / "raw_boe" / "processed_ids.txt" # We will reuse this

# --- The Semantic Chunking Regex ---
# This Regex is designed to split the text *before* major legal sections.
# It uses a "positive lookahead" (?=...) to split without consuming the delimiter.
LEGAL_BOUNDARY_REGEX = re.compile(
    r"\n\s*(?=Artículo \d+\.|Disposición \w+|Anexo|CAPÍTULO [IVXLCDM]+\.|TÍTULO [IVXLCDM]+\.)",
    re.IGNORECASE
)

def process_document(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Takes a single document (as a dict) and splits it into semantic chunks.
    This is a "pure" function, making it easy to test.
    
    Args:
        data: A dictionary representing one line from raw_data.jsonl
    
    Returns:
        A list of chunk dictionaries.
    """
    text = data.get("texto_limpio", "")
    doc_id = data.get("id", "unknown")
    doc_url = data.get("url", "")
    
    chunks_data = []
    
    if not text:
        log.warning(f"Document {doc_id} has no 'texto_limpio'. Skipping.")
        return []

    # Split the text using our regex. This keeps the delimiter (e.g., "Artículo 1.")
    # at the beginning of each chunk, which is exactly what we want.
    chunks = LEGAL_BOUNDARY_REGEX.split(text)

    chunk_seq = 0
    for chunk_text in chunks:
        chunk_text = chunk_text.strip()
        if not chunk_text:
            continue
            
        # Try to extract a title (the first line)
        first_line = chunk_text.split('\n', 1)[0]
        # A simple heuristic: if the first line is short and looks like a title, use it.
        if len(first_line) < 150 and first_line.isupper():
            chunk_title = first_line
        else:
            chunk_title = "Context"

        chunk_id = f"{doc_id}_chunk_{chunk_seq}"
        chunk_data = {
            "chunk_id": chunk_id,
            "doc_id": doc_id,
            "doc_url": doc_url,
            "chunk_title": chunk_title,
            "text": chunk_text
        }
        chunks_data.append(chunk_data)
        chunk_seq += 1
        
    return chunks_data

def run_chunking_pipeline():
    """
    Main function to run the full chunking pipeline:
    Reads raw data, processes each doc, and writes chunks to output.
    """
    log.info(f"Starting semantic chunking...")
    log.info(f"Input file: {RAW_DATA_FILE}")
    log.info(f"Output file: {OUTPUT_FILE}")

    if not RAW_DATA_FILE.exists():
        log.error(f"Input file not found: {RAW_DATA_FILE}. Aborting.")
        return

    # Delete the old output file to start fresh
    if OUTPUT_FILE.exists():
        log.warning(f"Deleting existing output file: {OUTPUT_FILE}")
        OUTPUT_FILE.unlink()

    total_chunks = 0
    total_docs = 0

    try:
        with open(RAW_DATA_FILE, 'r', encoding='utf-8') as input_f:
            with open(OUTPUT_FILE, 'a', encoding='utf-8') as output_f:
                
                for line in input_f:
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        log.warning(f"Skipping malformed JSON line: {line[:50]}...")
                        continue

                    # Call our pure, testable function
                    chunks = process_document(data)
                    
                    if chunks:
                        total_docs += 1
                        for chunk_data in chunks:
                            output_f.write(json.dumps(chunk_data, ensure_ascii=False) + '\n')
                            total_chunks += 1

    except IOError as e:
        log.error(f"Error reading/writing file: {e}")
    except Exception as e:
        log.error(f"An unexpected error occurred: {e}")

    log.info(f"Chunking complete. Processed {total_docs} documents.")
    log.info(f"Created {total_chunks} semantic chunks in {OUTPUT_FILE}.")

if __name__ == "__main__":
    # This allows the script to be run directly from the terminal
    run_chunking_pipeline()
