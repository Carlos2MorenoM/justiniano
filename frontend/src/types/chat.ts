/**
 * Represents a single message within the chat history.
 */
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    /** Optional metadata for RAG context, model info, or latency metrics */
    metadata?: Record<string, any>;
}

/**
 * Represents the holistic state of the chat interface.
 */
export interface ChatState {
    messages: Message[];
    isLoading: boolean;     // True while waiting for the initial server handshake
    isStreaming: boolean;   // True while receiving text chunks via SSE
    error: string | null;
}