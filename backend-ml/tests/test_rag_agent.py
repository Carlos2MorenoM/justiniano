# backend-ml/tests/test_rag_agent.py
"""
Integration tests for the RAG Agent API Router.

This module tests the /chat endpoint behavior, ensuring that:
1. The endpoint correctly handles valid requests and streams responses.
2. Pydantic validation works for missing or invalid data.
3. The 'X-User-Tier' header is correctly propagated to the service layer.

We use mocking to isolate the router from the actual RagService logic (Ollama/Qdrant),
focusing only on the API contract and orchestration.
"""
import pytest
from fastapi.testclient import TestClient
from main import app

# --- Helper for mocking async generators ---

async def mock_chat_generator(query: str, history: list, user_tier: str):
    """
    A fake async generator to simulate the streaming response from the LLM.
    It yields tokens one by one to mimic the behavior of Ollama.
    """
    responses = ["Hello", ", ", "I am", " ", "Justiniano", "."]
    for word in responses:
        yield word

# --- Fixtures ---

@pytest.fixture
def client():
    """
    Creates a TestClient instance for the FastAPI app.
    """
    return TestClient(app)

# --- Test Cases ---

def test_chat_endpoint_success(client, mocker):
    """
    Happy Path: Tests that the /chat endpoint works correctly.
    
    It mocks the 'rag_service.chat_stream' method to avoid calling real Ollama/Qdrant
    and verifies that the response is streamed and reconstructed correctly.
    """
    # 1. Mock the service method used by the router.
    # We use 'side_effect' to make the mock behave like an async generator.
    mock_service = mocker.patch(
        "rag_agent.router.rag_service.chat_stream",
        side_effect=mock_chat_generator
    )

    # 2. Make a POST request simulating a 'free' tier user
    response = client.post(
        "/chat",
        json={"query": "Hello"},
        headers={"X-User-Tier": "free"}
    )

    # 3. Assertions
    assert response.status_code == 200
    
    # Verify that the stream was correctly re-assembled into a single string
    # (TestClient automatically handles the stream consumption for assertions)
    assert response.text == "Hello, I am Justiniano."
    
    # Verify that the service was called with the correct arguments
    mock_service.assert_called_once_with("Hello", [], "free")

def test_chat_endpoint_validation_error(client):
    """
    Sad Path: Tests that Pydantic correctly validates missing required fields.
    In this case, the 'query' field is missing from the body.
    """
    response = client.post(
        "/chat",
        json={} # Missing 'query'
    )
    assert response.status_code == 422 # Unprocessable Entity

def test_chat_endpoint_tier_header(client, mocker):
    """
    Tests that the 'X-User-Tier' header is correctly extracted 
    and passed down to the service layer.
    """
    mock_service = mocker.patch(
        "rag_agent.router.rag_service.chat_stream",
        side_effect=mock_chat_generator
    )

    client.post(
        "/chat",
        json={"query": "Test tier"},
        headers={"X-User-Tier": "pro"} # Simulate a PRO user
    )

    # Verify that the service received 'pro' as the second argument
    mock_service.assert_called_once_with("Test tier", [], "pro")