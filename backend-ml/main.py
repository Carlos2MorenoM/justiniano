"""
Main FastAPI Application for the ML Backend.
Initializes the app and includes all routers.
"""

from fastapi import FastAPI
# V IMPORTANTE: ¿Está esta línea de importación?
from boe_ingestion.router import router as boe_router

app = FastAPI(
    title="ML Backend Service",
    description="Provides ML inference and data ingestion services.",
    version="0.1.0"
)

@app.get("/status")
def get_status():
    """
    Health check endpoint.
    """
    return {"status": "ok", "service": "backend-ml"}

app.include_router(boe_router)
