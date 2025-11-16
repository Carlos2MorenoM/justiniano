"""
Admin API Router for BOE Ingestion.

Exposes administrative endpoints, secured by an API Key.
"""

import os
import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException, Header, Depends
from pydantic import BaseModel, Field
from .orchestrator import ingest_boe_data

log = logging.getLogger(__name__)

# Fetch the required API key from environment variables.
# This is critical for production: the key is NOT hardcoded.
ML_ADMIN_API_KEY = os.getenv("ML_ADMIN_API_KEY")


async def verify_api_key(x_api_key: str = Header(..., description="Admin API Key")):
    """
    FastAPI Dependency to verify the X-API-Key header.

    This function is run *before* the endpoint logic.
    If it raises an exception, the request is stopped.
    """
    if not ML_ADMIN_API_KEY:
        # This is a server configuration error, not a client error.
        log.error("ML_ADMIN_API_KEY environment variable is not set. Cannot authenticate requests.")
        raise HTTPException(status_code=500, detail="Internal Server Error: Missing API Key Configuration")

    if x_api_key != ML_ADMIN_API_KEY:
        # This is a client authentication error.
        log.warning(f"Failed admin access attempt with key: {x_api_key}")
        raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")

    # If keys match, the request is allowed to proceed.
    return True


# --- Router Configuration ---
router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    # NEW: Apply the security dependency to ALL endpoints in this router.
    dependencies=[Depends(verify_api_key)]
)


class IngestRequest(BaseModel):
    """
    Pydantic model for the ingestion request body.
    Validates the input format.
    """
    start_date: str = Field(
        ...,
        pattern=r"^\d{8}$",
        example="20230101",
        description="Start date in YYYYMMDD format"
    )
    end_date: str = Field(
        ...,
        pattern=r"^\d{8}$",
        example="20230131",
        description="End date in YYYYMMDD format"
    )


@router.post("/ingest-boe")
async def trigger_boe_ingestion(
        request: IngestRequest,
        background_tasks: BackgroundTasks
):
    """
    Triggers a background ingestion task for the BOE.

    This endpoint is secured and requires a valid X-API-Key header.
    It returns an immediate "Accepted" response while the task
    runs in the background.
    """
    log.info(f"Admin request received: Triggering ingestion from {request.start_date} to {request.end_date}")

    # Add the long-running function as a background task
    background_tasks.add_task(
        ingest_boe_data,
        request.start_date,
        request.end_date
    )

    # Return an immediate response to the client (BFF)
    return {
        "status": "Accepted",
        "message": f"Background ingestion task started from {request.start_date} to {request.end_date}."
    }