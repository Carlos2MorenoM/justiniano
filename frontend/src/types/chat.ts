/**
 * Ragas Evaluation Metrics.
 * Scores range from 0.0 to 1.0.
 */
export interface EvaluationMetrics {
    /** Measures factual consistency with the retrieved context (Hallucination check) */
    faithfulness: number;
    /** Measures how well the response addresses the user's query */
    answer_relevancy: number;
}

/**
 * Represents a single message within the chat history.
 */
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    /**
     * Flexible metadata container.
     * Stores model info, user tier, and quality metrics when available.
     */
    metadata?: {
        model?: string;
        tier?: string;
        metrics?: EvaluationMetrics;
        [key: string]: any;
    };
}

/**
 * Global state interface for the Chat hook.
 */
export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;
}