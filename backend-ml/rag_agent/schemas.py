"""
Pydantic schemas for the RAG Agent module.
Defines the data structure for chat requests and responses.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class ChatRequest(BaseModel):
    """
    Represents a user query sent to the RAG agent.
    """
    query: str = Field(..., description="The user's question or command.")
    history: Optional[List[dict]] = Field(default=[], description="Previous conversation context.")
    message_id: Optional[str] = Field(
        default=None, 
        description="Unique ID of the message to link evaluations."
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "query": "¿Qué ayudas hay para la instalación de placas solares?",
                "message_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }
    }
class EvaluationResponse(BaseModel):
    """
    Represents the evaluation metrics for a specific interaction.
    """
    message_id: str
    metrics: Dict[str, float]
    status: str = "completed"

class ChatResponse(BaseModel):
    """
    Represents the agent's response.
    In a streaming scenario, this schema documents the final structure.
    """
    response: str = Field(..., description="The AI generated answer.")
    used_model: str = Field(..., description="The name of the model used (Free vs Pro).")
    retrieved_docs: List[str] = Field(default=[], description="List of BOE document IDs used as context.")