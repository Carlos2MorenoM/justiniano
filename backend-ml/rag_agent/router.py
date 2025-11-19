"""
API Router for the RAG Agent.
Handles chat endpoints and tier-based logic.
"""
from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse
from .schemas import ChatRequest
from .service import rag_service

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
    
    - **Free Tier**: Uses Llama 3.1 8B. Fast, basic RAG.
    - **Pro Tier**: Uses Mistral NeMo 12B. Slower, deeper reasoning (Agent capabilities).
    
    Returns a Server-Sent Events (SSE) stream of the response.
    """
    
    # We use StreamingResponse to send tokens as they are generated
    return StreamingResponse(
        rag_service.chat_stream(request.query, x_user_tier),
        media_type="text/event-stream"
    )
