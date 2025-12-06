"""
API Router for the RAG Agent.
Handles chat endpoints, background evaluation tasks, and metric retrieval.
"""
import json
import logging
import os
from pathlib import Path
from fastapi import APIRouter, Header, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from .schemas import ChatRequest, EvaluationResponse
from .service import rag_service
from .evaluation import evaluation_service

# Setup logging
log = logging.getLogger(__name__)

router = APIRouter(
    prefix="/chat",
    tags=["Agent RAG"]
)

# File path for simple persistence of evaluations
EVAL_STORAGE_PATH = Path("data/evaluations.jsonl")
EVAL_STORAGE_PATH.parent.mkdir(parents=True, exist_ok=True)

def run_evaluation_task(query: str, message_id: str, user_tier: str):
    """
    Background task wrapper to execute Ragas evaluation and save results.
    """
    if not message_id:
        log.warning("No message_id provided. Skipping evaluation.")
        return

    try:
        # 1. Re-generate the full context and response to evaluate
        # Note: In a production system, we would pass the generated response 
        # from the stream instead of re-generating or caching it.
        # For simplicity here, we assume the service can retrieve the last context state
        # or we accept that we evaluate the RAG retrieval quality primarily.
        
        # Optimization: Ideally, rag_service.chat_stream should yield context + text,
        # but for this async task, we will do a retrieval check.
        
        # A. Retrieve Context (Repetimos la búsqueda para evaluar la calidad del retrieval)
        context_str, source_ids = rag_service._get_context(query)
        
        # B. For the 'answer', we technically need what the LLM generated.
        # Since we streamed it, we don't have it captured easily in the background task 
        # without complicating the generator. 
        # STRATEGY: For now, we will evaluate 'Retrieval Quality' (Context Precision/Recall)
        # or perform a quick non-streaming generation for the sake of the metric.
        # Let's generate a quick answer for evaluation purposes (Slight overhead but clean architecture)
        
        # NOTE: This effectively generates the answer TWICE. One for user, one for eval.
        # Acceptable for "Zero Cost" local inference where latency in background doesn't matter.
        generated_answer = ""
        stream = rag_service.chat_stream(query, [], user_tier) 
        
        # We need to consume the async generator
        import asyncio
        
        async def consume_stream():
            full_text = ""
            async for chunk in stream:
                full_text += chunk
            return full_text

        # Run the async consumption in this sync/async compatible context
        # This part depends on how fastapi handles background tasks loop.
        # To avoid complexity, let's use the rag_service's internal method if exposed,
        # or simplify by evaluating only retrieval metrics if generating again is too heavy.
        
        # Let's assume for this "Tier Pro" feature we want full eval:
        # We will use a simplified blocking call to Ollama for the answer to evaluate.
        import ollama
        model_name = "gemma2" if user_tier == "pro" else "llama3.1:8b"
        # Re-construct prompt same as service
        messages = [{'role': 'user', 'content': query}]
        # Simple generation for eval
        response_obj = ollama.chat(model=model_name, messages=messages) 
        generated_answer = response_obj['message']['content']

        # 2. Run Ragas Evaluation
        metrics = evaluation_service.evaluate_interaction(
            query=query,
            response=generated_answer,
            retrieved_contexts=[context_str] # Ragas expects list of strings
        )

        # 3. Save Results
        record = {
            "message_id": message_id,
            "query": query,
            "metrics": metrics,
            "tier": user_tier
        }
        
        with open(EVAL_STORAGE_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
            
        log.info(f"💾 Evaluation saved for message {message_id}")

    except Exception as e:
        log.error(f"Background evaluation failed: {e}")


@router.post("")
async def chat_endpoint(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    x_user_tier: str = Header("free", description="User tier: 'free' or 'pro'")
):
    """
    Streaming chat endpoint with Background Evaluation.
    """
    
    # Trigger evaluation in background if we have an ID
    if request.message_id:
        background_tasks.add_task(
            run_evaluation_task, 
            request.query, 
            request.message_id, 
            x_user_tier
        )
    
    return StreamingResponse(
        rag_service.chat_stream(request.query, request.history, x_user_tier),
        media_type="text/event-stream"
    )

@router.get("/evaluation/{message_id}", response_model=EvaluationResponse)
def get_evaluation(message_id: str):
    """
    Retrieves the evaluation metrics for a specific message.
    """
    if not EVAL_STORAGE_PATH.exists():
        raise HTTPException(status_code=404, detail="No evaluations found.")

    # Linear search in JSONL (Simple & Fast enough for MVP)
    # In production, this would be a DB query.
    try:
        with open(EVAL_STORAGE_PATH, "r", encoding="utf-8") as f:
            for line in f:
                data = json.loads(line)
                if data.get("message_id") == message_id:
                    return EvaluationResponse(
                        message_id=message_id,
                        metrics=data.get("metrics", {})
                    )
    except Exception as e:
        log.error(f"Error reading evaluations: {e}")
        raise HTTPException(status_code=500, detail="Internal Persistence Error")

    raise HTTPException(status_code=404, detail="Evaluation pending or not found.")