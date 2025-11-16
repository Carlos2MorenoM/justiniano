import pytest
from fastapi.testclient import TestClient

# Define a static API key for the test environment.
TEST_API_KEY = "my-secret-test-key-123"

@pytest.fixture
def client(monkeypatch, mocker):
    """
    Fixture to set up the test client.
    
    This fixture is now responsible for:
    1.  Patching the environment variable for the API key.
    2.  Mocking the background task.
    3.  *Only then* importing the app and creating the TestClient.
    """
    
    # 1. Set env var FIRST.
    monkeypatch.setenv("ML_ADMIN_API_KEY", TEST_API_KEY)
    
    # 2. Mock the background task.
    mocker.patch(
        'boe_ingestion.router.ingest_boe_data',
        return_value=None,
        autospec=True
    )
    
    # 3. NOW we import the app and create the client.
    # The app will load *after* the monkeypatch is active.
    from main import app
    from fastapi.testclient import TestClient

    with TestClient(app) as test_client:
        yield test_client

# --- Test Cases ---

def test_ingest_missing_api_key(client):
    """
    Tests the security dependency: requests without an API key
    header must be rejected.
    FastAPI returns 422 (Unprocessable Entity) for a missing required Header.
    """
    response = client.post(
        "/admin/ingest-boe",
        json={"start_date": "20230101", "end_date": "20230101"}
    )
    # This is the fix: We expect 422, not 403.
    assert response.status_code == 422
    # Let's check the error is *about* the missing header
    assert "x-api-key" in response.text
    assert "Field required" in response.text

def test_ingest_wrong_api_key(client):
    """
    Tests the security dependency: requests with an incorrect API key
    must be rejected with 403 Forbidden.
    (This test should now pass, as the 500 error is fixed)
    """
    response = client.post(
        "/admin/ingest-boe",
        headers={"X-API-Key": "this-is-the-wrong-key"},
        json={"start_date": "20230101", "end_date": "20230101"}
    )
    assert response.status_code == 403
    assert response.json() == {"detail": "Forbidden: Invalid API Key"}

def test_ingest_bad_pydantic_body(client):
    """
    Tests Pydantic validation: requests with the correct key but
    a malformed body must be rejected with 422 Unprocessable Content.
    (This test should now pass, as the 500 error is fixed)
    """
    response = client.post(
        "/admin/ingest-boe",
        headers={"X-API-Key": TEST_API_KEY}, # Key is correct
        json={"start_date": "20230101"}      # Body is missing 'end_date'
    )
    assert response.status_code == 422

def test_ingest_success_and_task_called(client, mocker):
    """
    Tests the "happy path".
    (This test should now pass, as the 500 error is fixed)
    """
    mock_ingest_task = mocker.patch('boe_ingestion.router.ingest_boe_data')
    test_body = {"start_date": "20230101", "end_date": "20230102"}

    response = client.post(
        "/admin/ingest-boe",
        headers={"X-API-Key": TEST_API_KEY},
        json=test_body
    )
    
    assert response.status_code == 200
    assert response.json() == {
        "status": "Accepted",
        "message": "Background ingestion task started from 20230101 to 20230102."
    }
    mock_ingest_task.assert_called_once_with("20230101", "20230102")
