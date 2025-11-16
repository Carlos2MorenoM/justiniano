"""
Orchestrates the end-to-end BOE ingestion pipeline.

This module is responsible for:
1. Loading the cache of already processed document IDs.
2. Iterating over a date range.
3. Calling the api_client to fetch document IDs for each day.
4. Filtering out IDs that are already in the cache.
5. Calling the api_client to fetch XML for new documents.
6. Calling the parsing_service to extract clean text.
7. Calling io_helpers to save the new data and update the ID cache.
This version is hardened with a global try/finally block
to ensure completion is always logged.
"""
import httpx
import logging
from pathlib import Path
from datetime import datetime, timedelta

# --- Imports from our refactored modules ---
from .services import api_client, parsing_service
# Import the 'io_helpers' module to access both save functions
from utils import io_helpers 

log = logging.getLogger(__name__)

# --- Configuration for this specific task ---
# Resolve paths relative to this file's location
DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "raw_boe"
OUTPUT_FILE = DATA_DIR / "raw_data.jsonl"
# This file will store a simple list of IDs (one per line)
PROCESSED_IDS_FILE = DATA_DIR / "processed_ids.txt"

# Ensure the data directory exists before we start
DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_processed_ids() -> set[str]:
    """
    Loads the set of already processed IDs from the cache file
    for efficient O(1) in-memory lookup.
    
    Returns:
        A set of document IDs (e.g., {"BOE-A-2023-11073", ...})
    """
    if not PROCESSED_IDS_FILE.exists():
        log.info(f"{PROCESSED_IDS_FILE.name} not found. Starting from scratch.")
        return set()
    
    try:
        with open(PROCESSED_IDS_FILE, 'r', encoding='utf-8') as f:
            # Read all lines, strip whitespace/newlines, and return as a set
            # This efficiently filters out any potential empty lines
            return set(line.strip() for line in f if line.strip())
    except IOError as e:
        log.error(f"Could not read {PROCESSED_IDS_FILE}: {e}. Returning empty set.")
        # Return an empty set on error to be safe and avoid crashing
        return set()


async def ingest_boe_data(start_date_str: str, end_date_str: str):
    """
    Main orchestration function for the ingestion background task.
    
    This function is idempotent: it will check 'processed_ids.txt'
    and skip any documents that have already been downloaded,
    making it safe to re-run over the same date ranges.
    
    Args:
        start_date_str: Start date in "YYYYMMDD" format.
        end_date_str: End date in "YYYYMMDD" format.
    """
    log.info(f"--- INGESTION TASK STARTED: {start_date_str} to {end_date_str} ---")
    
    total_new_docs_processed = 0
    existing_ids = set() # Initialize empty set

    try:
        # --- 1. Load Cache ---
        log.info(f"Loading already processed IDs from {PROCESSED_IDS_FILE.name}...")
        existing_ids = load_processed_ids()
        log.info(f"Found {len(existing_ids)} previously processed IDs in cache.")

        # --- 2. Parse Dates ---
        try:
            start_date = datetime.strptime(start_date_str, "%Y%m%d")
            end_date = datetime.strptime(end_date_str, "%Y%m%d")
        except ValueError as e:
            log.error(f"Invalid date format: {e}. Task aborted.")
            return # This is a user error, safe to exit

        current_date = start_date

        # --- 3. Start Main Loop ---
        async with httpx.AsyncClient(timeout=30.0) as client:
            while current_date <= end_date:
                date_str = current_date.strftime("%Y%m%d")
                log.info(f"Processing date: {date_str}")
                
                # api_client is hardened, won't raise 404/500
                doc_ids = await api_client.fetch_summary_ids(client, date_str)
                
                if not doc_ids:
                    log.warning(f"No new documents found for {date_str}. Skipping.")
                    current_date += timedelta(days=1)
                    continue

                log.info(f"Found {len(doc_ids)} document IDs for {date_str}. Checking against cache...")
                
                new_docs_this_day = 0
                for doc_id in doc_ids:
                    
                    # 4. === THE IDEMPOTENCY CHECK ===
                    if doc_id in existing_ids:
                        # Use log.debug for "spammy" messages
                        log.debug(f"ID {doc_id} already processed. Skipping.")
                        continue
                    
                    # 5. Process the new document
                    new_docs_this_day += 1
                    
                    # api_client is hardened, won't raise 404/500
                    xml_content = await api_client.fetch_document_xml(client, doc_id)
                    if not xml_content:
                        continue 

                    clean_text = parsing_service.parse_legal_text(xml_content)
                    if not clean_text:
                        log.warning(f"No text extracted for {doc_id}. Skipping.")
                        continue
                    
                    doc_data = {
                        "id": doc_id,
                        "date": date_str,
                        "url": f"https://www.boe.es/diario_boe/txt.php?id={doc_id}",
                        "texto_limpio": clean_text
                    }
                    
                    # 6. --- Save to disk (Atomic operation) ---
                    io_helpers.save_to_jsonl(doc_data, str(OUTPUT_FILE))
                    io_helpers.save_processed_id(doc_id, str(PROCESSED_IDS_FILE))
                    existing_ids.add(doc_id)
                    # --- End of save operation ---

                log.info(f"Date {date_str} completed. Found {new_docs_this_day} new documents.")
                total_new_docs_processed += new_docs_this_day
                current_date += timedelta(days=1)

    except Exception as e:
        # --- 4. Global Error Catcher ---
        log.error(f"CRITICAL ERROR! Ingestion task failed unexpectedly: {e}", exc_info=True)
        # exc_info=True prints the full stack trace

    # --- TODO: Finally logs not showing on server ---
    finally:
        # --- 5. Guaranteed Final Log ---
        # This block will ALWAYS run, even if the task crashes.
        log.info("="*50)
        log.info(f"INGESTION TASK FINISHED (Run complete)")
        log.info(f"Total new documents processed in THIS RUN: {total_new_docs_processed}")
        log.info(f"Total unique documents in cache: {len(existing_ids)}")
        log.info("="*50)
