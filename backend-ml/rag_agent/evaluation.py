"""
Evaluation Service using Ragas.

This module implements an 'LLM-as-a-Judge' evaluator using local Ollama models
to assess the quality of RAG interactions. It calculates metrics such as
Faithfulness and Answer Relevancy to ensure the agent's reliability.
"""
import logging
import os
import math
from typing import List, Dict
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy
from datasets import Dataset
from langchain_ollama import ChatOllama
from langchain_community.embeddings import OllamaEmbeddings

# Configure logger for this module
log = logging.getLogger(__name__)

# Configuration for the Judge LLM
JUDGE_MODEL_NAME = "llama3.1:8b" 

# Network Configuration for Docker
OLLAMA_BASE_URL = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434")

class EvaluationService:
    """
    Service responsible for running quality evaluations on RAG traces.
    """

    def __init__(self):
        try:
            log.info(f"Initializing Evaluation Service connecting to: {OLLAMA_BASE_URL}")
            
            self.judge_llm = ChatOllama(
                model=JUDGE_MODEL_NAME,
                base_url=OLLAMA_BASE_URL,
                temperature=0
            )
            
            self.embeddings = OllamaEmbeddings(
                model=JUDGE_MODEL_NAME,
                base_url=OLLAMA_BASE_URL
            )
            
            log.info(f"Evaluation Service initialized successfully with Judge: {JUDGE_MODEL_NAME}")
        except Exception as e:
            log.error(f"Failed to initialize Evaluation Service: {e}")
            self.judge_llm = None

    def evaluate_interaction(
        self, 
        query: str, 
        response: str, 
        retrieved_contexts: List[str]
    ) -> Dict[str, float]:
        """
        Evaluates a single RAG interaction (Trace) using Ragas metrics.
        Sanitizes output to prevent JSON serialization errors with NaN/Inf.
        """
        if not self.judge_llm:
            log.warning("Skipping evaluation: Judge LLM is not initialized.")
            return {}

        log.info("⚖️ Starting Ragas Evaluation for current interaction...")

        data = {
            'question': [query],
            'answer': [response],
            'contexts': [retrieved_contexts],
        }
        dataset = Dataset.from_dict(data)
        metrics = [faithfulness, answer_relevancy]

        try:
            results = evaluate(
                dataset=dataset,
                metrics=metrics,
                llm=self.judge_llm,
                embeddings=self.embeddings,
                raise_exceptions=False,
            )

            scores = results.to_pandas().iloc[0].to_dict()
            
            # --- SANITIZATION LOGIC ---
            def safe_score(val):
                try:
                    f = float(val)
                    if math.isnan(f) or math.isinf(f):
                        return 0.0
                    return round(f, 2)
                except (ValueError, TypeError):
                    return 0.0

            final_metrics = {
                "faithfulness": safe_score(scores.get("faithfulness")),
                "answer_relevancy": safe_score(scores.get("answer_relevancy"))
            }
            
            log.info(f"✅ Evaluation complete. Scores: {final_metrics}")
            return final_metrics

        except Exception as e:
            log.error(f"❌ Critical error during Ragas evaluation: {e}", exc_info=True)
            return {}

# Singleton instance to be imported by the router
evaluation_service = EvaluationService()