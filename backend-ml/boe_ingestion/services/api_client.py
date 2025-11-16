"""
HTTP Client for interacting with the BOE (Boletín Oficial del Estado) API.
"""
import httpx
import logging
import json
from httpx import HTTPStatusError

log = logging.getLogger(__name__)

# --- Constantes ---
SUMARIO_URL = "https://boe.es/datosabiertos/api/boe/sumario/{date_str}"
DOC_XML_URL = "https://www.boe.es/diario_boe/xml.php?id={doc_id}"


async def fetch_summary_ids(client: httpx.AsyncClient, date_str: str) -> list[str]:
    """
    Fetches all document ID's from the complexly nested BOE summary

    This function navigates the JSON structure:
    data -> sumario -> diario[] -> seccion[] -> departamento[] -> epigrafe[] -> item[]

    It also handles a key inconsistency where 'item' can be a single object or a list of objects

    Args:
        client: An httpx.AsyncClient instance
        date_str: the date in "YYYYMMDD" format

    Returns:
        A flat list of all documents IDs (e.g, "BOE-A-2023-11073")
        found in the summary
    """
    all_doc_ids = []
    try:
        url = SUMARIO_URL.format(date_str=date_str)
        response = await client.get(url, headers={"Accept": "application/json"})
        
        # This will raise HTTPStatusError for 4xx or 5xx responses
        response.raise_for_status() 
        
        data = response.json().get("data", {})
        diario_list = data.get("sumario", {}).get("diario", [])
        
        for diario in diario_list:
            if not isinstance(diario, dict):
                log.warning(f"Skipping malformed 'diario' item (not a dict) on {date_str}")
                continue

            for seccion in diario.get("seccion", []):
                if not isinstance(seccion, dict):
                    log.warning(f"Skipping malformed 'seccion' item (not a dict) on {date_str}")
                    continue
                # --- Sections 1 and 3 filter (nombramientos, oposiciones, anuncios y licitaciones)---
                codigo_seccion = seccion.get("codigo")
                if codigo_seccion not in ["1", "3"]:
                    log.debug(f"Skipping section {codigo_seccion} (not legislation)")
                    continue
                # --- End of filter ---
                for departamento in seccion.get("departamento", []):
                    if not isinstance(departamento, dict):
                        log.warning(f"Skipping malformed 'departamento' item (not a dict) on {date_str}")
                        continue

                    for epigrafe in departamento.get("epigrafe", []):
                        if not isinstance(epigrafe, dict):
                            log.warning(f"Skipping malformed 'epigrafe' item (not a dict) on {date_str}")
                            continue

                        item_data = epigrafe.get("item")
                        if not item_data:
                            continue
                            
                        items_to_process = []
                        if isinstance(item_data, list):
                            items_to_process = item_data
                        elif isinstance(item_data, dict):
                            items_to_process = [item_data]
                        
                        for item in items_to_process:
                            if isinstance(item, dict):
                                doc_id = item.get("identificador")
                                url_xml = item.get("url_xml")
                                
                                if doc_id and url_xml:
                                    all_doc_ids.append(doc_id)

    except HTTPStatusError as e:
        if e.response.status_code == 404:
            # Regular event (sunday or holiday)
            log.warning(f"No summary found for {date_str} (404 Not Found). This is normal. Skipping.")
        else:
            # Real error (500, 403, 503...)
            log.error(f"HTTP error fetching summary for {date_str}: {e}")
        return []

    except httpx.RequestError as e:
        log.error(f"Network error fetching summary for {date_str}: {e}")
        return []
    except json.JSONDecodeError as e:
        log.error(f"JSON decode error for summary {date_str}: {e}")
        return []
        
    return list(set(all_doc_ids))


async def fetch_document_xml(client: httpx.AsyncClient, doc_id: str) -> str | None:
    """
    Fetches the full XML content for a specific document ID.
    Hardened to handle 404s gracefully.
    """
    try:
        url = DOC_XML_URL.format(doc_id=doc_id)
        response = await client.get(url)
        
        if response.status_code == 404:
            log.warning(f"No XML document found for {doc_id} (404 Not Found). Skipping.")
            return None

        response.raise_for_status()
        return response.text
        
    except HTTPStatusError as e:
        log.error(f"HTTP error fetching XML for {doc_id}: {e}")
        return None
    except httpx.RequestError as e:
        log.error(f"Network error fetching XML for {doc_id}: {e}")
        return None