"""
Main FastAPI Application for the ML Backend.
Initializes the app and includes all routers.
"""

from fastapi import FastAPI
from boe_ingestion.router import router as boe_router
from rag_agent.router import router as rag_router
import uvicorn
import os

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
app.include_router(rag_router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)