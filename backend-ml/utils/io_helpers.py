"""
Generic I/O helper functions for the application.
"""
import json
import logging

log = logging.getLogger(__name__)

def save_to_jsonl(data: dict, file_path: str, mode: str = 'a'):
    """
    Appends a single dictionary to a JSONL file.

    Args:
        data: The dictionary to save.
        file_path: The full path to the output file.
        mode: File mode ('a' for append, 'w' for write).
    """
    try:
        with open(file_path, mode, encoding='utf-8') as f:
            json_line = json.dumps(data, ensure_ascii=False)
            f.write(json_line + '\n')
    except IOError as e:
        log.error(f"Failed to write to JSONL file {file_path}: {e}")

def save_processed_id(doc_id: str, file_path: str):
    """
    Appends a single document ID to the processed IDs log file.
    This acts as a fast, simple "set" on disk to prevent re-processing.
    
    Args:
        doc_id: The ID to save (e.g., "BOE-A-2023-11073").
        file_path: The full path to the processed IDs file.
    """
    try:
        # 'a' mode = append
        with open(file_path, 'a', encoding='utf-8') as f:
            f.write(doc_id + '\n')
    except IOError as e:
        log.error(f"Failed to write to processed_ids file {file_path}: {e}")