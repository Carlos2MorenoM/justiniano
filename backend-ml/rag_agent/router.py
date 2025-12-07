"""
API Router for the RAG Agent.
Handles chat endpoints without heavy evaluation overhead.
"""
import logging
from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse
from .schemas import ChatRequest
from .service import rag_service

# Setup logging
log = logging.getLogger(__name__)

router = APIRouter(
    prefix="/chat",
    tags=["Agent RAG"]
)

@router.post("")
async def chat_endpoint(
    request: ChatRequest,
    x_user_tier: str = Header("free", description="User tier: 'free' or 'pro'")
):
    """
    Streaming chat endpoint.
     Optimized for low latency: No background evaluation.
    """
    
    # Just stream the response directly. No extra tasks.
    return StreamingResponse(
        rag_service.chat_stream(request.query, request.history, x_user_tier),
        media_type="text/event-stream"
    )