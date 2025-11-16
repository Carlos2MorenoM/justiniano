"""
HTTP Client for interacting with the BOE (Boletín Oficial del Estado) API
"""
import httpx
import logging
import json

log = logging.getLogger(__name__)

SUMARIO_URL = "https://boe.es/datosabiertos/api/boe/sumario/{date_str}"
DOC_XML_URL = "https://www.boe.es/diario_boe/xml.php?id={doc_id}"

async def fetch_summary_ids(client: httpx.AsyncClient, date_str:str) ->list[str]:
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
        response.raise_for_status()

        data = response.json().get("data", {})

        # Start nested traversal
        # We use .get(key. []) to safely iterate even if the key is missing
        diario_list = data.get("sumario", {}).get("diario", [])

        for diario in diario_list:
            for seccion in diario.get("seccion", []):
                for departamento in seccion.get("departamento", []):
                    for epigrafe in departamento.get("epigrafe", []):

                        item_data = epigrafe.get("item")
                        if not item_data:
                            continue
                        # --- Handle the 'item inconsistency (list of objects)'
                        items_to_process = []
                        if isinstance(item_data, list):
                            items_to_process = item_data
                        elif isinstance(item_data, dict):
                            items_to_process = [item_data]

                        # --- Process the item(s) ---
                        for item in items_to_process:
                            doc_id = item.get("identificador")
                            url_xml = item.get("url_xml")

                            # We only want items that have both an ID and a valid XML url
                            if doc_id and url_xml:
                                all_doc_ids.append(doc_id)

            return list(set(all_doc_ids))

    except httpx.RequestError as e:
        log.error(f"Network error fetching summary for {date_str}: {e}")
        return []

async def fetch_document_xml(client: httpx.AsyncClient, doc_id:str) -> str | None:
    """
    Fetches the full XML content for a specific document ID
    """
    try:
        url = DOC_XML_URL.format(doc_id=doc_id)
        response = await client.get(url)
        response.raise_for_status()
        return response.text
    except httpx.RequestError as e:
        log.error(f"Network error fetching XML for {doc_id}: {e}")
        return None