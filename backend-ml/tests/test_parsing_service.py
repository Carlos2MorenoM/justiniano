import pytest
from pathlib import Path

from boe_ingestion.services.parsing_service import parse_legal_text

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "sample_boe_doc.xml"

@pytest.fixture
def sample_xml_content() -> str:
    """
    Pytest fixture that reads our sample XML file from disk
    and returns its content as a string.
    """
    if not FIXTURE_PATH.exists():
        raise FileNotFoundError(f"Fixture file not found at {FIXTURE_PATH}")
    return FIXTURE_PATH.read_text(encoding="utf-8")

# --- Tests ---

def test_parse_legal_text_success(sample_xml_content):
    """
    Tests the "happy path": given a valid BOE XML, it extracts
    the correct text and excludes metadata.
    """
    clean_text = parse_legal_text(sample_xml_content)

    assert clean_text.startswith("La Ley 9/2017, de 8 de noviembre, de Contratos del Sector Público")
    
    assert "Disposición adicional única. Supresión de órganos." in clean_text
    
    assert "MARÍA JESÚS MONTERO CUADRADO" in clean_text
    
    assert "<metadatos>" not in clean_text
    assert "https://www.boe.es/eli/es/rd/2023/05/09/342" not in clean_text
    
    assert "el art. 12.15 del Real Decreto 1113/2018" not in clean_text

def test_parse_legal_text_empty_and_invalid():
    """
    Tests the "sad path": ensures the function doesn't crash
    and returns an empty string for bad or empty input.
    """
    assert parse_legal_text("") == ""
    assert parse_legal_text("<documento><texto></texto></documento>") == ""
    assert parse_legal_text("<xml>inválido sin cerrar") == ""
    assert parse_legal_text("<documento></documento>") == "" # Test "No main <texto> tag found"