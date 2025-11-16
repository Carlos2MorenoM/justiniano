import pytest

from data_processing.chunker import process_document

# --- Fixtures ---

@pytest.fixture
def sample_doc_legal():
    """A sample document with clear legal boundaries."""
    return {
        "id": "BOE-A-TEST-123",
        "url": "http://example.com",
        "texto_limpio": (
            "Este es el prólogo.\n"
            "Aquí se explica la ley.\n"
            "Artículo 1. Objeto.\n"
            "El objeto de esta ley es probar.\n"
            "Artículo 2. Ámbito.\n"
            "El ámbito de esta ley es un test.\n"
            "Disposición final primera. Título.\n"
            "Esto es una disposición."
        )
    }

@pytest.fixture
def sample_doc_prose():
    """A sample document with no legal boundaries (like an announcement)."""
    return {
        "id": "BOE-A-TEST-456",
        "url": "http://example.com",
        "texto_limpio": (
            "Se convoca a los interesados a la licitación.\n"
            "El plazo de presentación es de 20 días.\n"
            "Firman: El Presidente."
        )
    }

# --- Tests ---

def test_process_document_splits_correctly(sample_doc_legal):
    """
    Tests the "happy path": Verifies that the document is split
    correctly at each legal boundary (Artículo, Disposición).
    """
    chunks = process_document(sample_doc_legal)
    
    # Should be split into 4 chunks:
    # 1. Prologue
    # 2. Artículo 1
    # 3. Artículo 2
    # 4. Disposición final
    assert len(chunks) == 4
    
    # Check that the text is correct and includes the boundary
    assert chunks[0]["text"].startswith("Este es el prólogo.")
    assert chunks[1]["text"].startswith("Artículo 1. Objeto.")
    assert chunks[2]["text"].startswith("Artículo 2. Ámbito.")
    assert chunks[3]["text"].startswith("Disposición final primera. Título.")
    
    # Check metadata propagation
    assert chunks[0]["doc_id"] == "BOE-A-TEST-123"
    assert chunks[2]["chunk_id"] == "BOE-A-TEST-123_chunk_2"
    assert "Context" in chunks[0]["chunk_title"]

def test_process_document_no_split(sample_doc_prose):
    """
    Tests the "fallback path": A document with no legal boundaries
    should be returned as a single chunk.
    """
    chunks = process_document(sample_doc_prose)
    
    # Should only create one single chunk
    assert len(chunks) == 1
    assert chunks[0]["text"].startswith("Se convoca a los interesados")
    assert chunks[0]["doc_id"] == "BOE-A-TEST-456"

def test_process_document_empty():
    """
    Tests the "sad path": An empty or invalid document
    should return an empty list, not crash.
    """
    assert process_document({"id": "empty", "texto_limpio": ""}) == []
    assert process_document({"id": "no_text"}) == []