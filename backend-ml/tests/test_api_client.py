import pytest
import httpx

from boe_ingestion.services import api_client

pytestmark = pytest.mark.network

@pytest.mark.asyncio  # Necesario para funciones de test 'async'
async def test_fetch_summary_ids_contract():
    """
    Tests the contract of the live BOE summary API.
    It verifies that the API still returns the expected JSON structure
    by successfully parsing a known document ID from a fixed date.
    
    This test requires a live internet connection.
    """
    test_date = "20230510"  # The date we used for our fixtures
    expected_doc_id = "BOE-A-2023-11073" # A known document from that date

    async with httpx.AsyncClient() as client:
        doc_ids = await api_client.fetch_summary_ids(client, test_date)

    assert isinstance(doc_ids, list)
    assert len(doc_ids) > 0
    assert expected_doc_id in doc_ids

@pytest.mark.asyncio
async def test_fetch_document_xml_contract():
    """
    Tests the contract of the live BOE XML document API.
    It verifies that a known document ID still returns valid XML.
    
    This test requires a live internet connection.
    """
    test_doc_id = "BOE-A-2023-11073"
    
    async with httpx.AsyncClient() as client:
        xml_content = await api_client.fetch_document_xml(client, test_doc_id)
        
    assert xml_content is not None
    assert isinstance(xml_content, str)
    assert "<documento" in xml_content
    assert test_doc_id in xml_content
    assert "MARÍA JESÚS MONTERO CUADRADO" in xml_content