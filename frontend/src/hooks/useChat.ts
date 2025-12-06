import { useState, useCallback, useRef } from 'react';
import type { Message } from '../types/chat';

// TODO: Move to environment variables (VITE_API_URL) for production
const API_URL = 'http://localhost:3000/chat';

/**
 * Custom hook to manage chat logic, including state management,
 * API communication, and Server-Sent Events (SSE) streaming.
 *
 * @returns An object containing the chat state and the sendMessage function.
 */
export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reference to the AbortController to cancel pending requests if needed
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Sends a message to the RAG Agent and handles the streaming response.
     *
     * @param content - The text content of the user's message.
     */
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        // 1. Optimistic UI: Immediately add the user's message to the state
        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        // Cancel any previous in-flight request to avoid race conditions
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            // 2. Initiate the POST request to the BFF
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-tier': 'free',      // TODO: Make dynamic based on auth context
                    'x-user-id': 'tester-frontend', // Mock user ID for dev
                },
                // The backend expects 'message', not 'query' (handled by BFF DTO)
                body: JSON.stringify({ message: content }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) throw new Error('Failed to connect to Justiniano Agent');
            if (!response.body) throw new Error('ReadableStream not supported in this browser');

            // 3. Prepare a placeholder message for the assistant's response
            const assistantMessageId = crypto.randomUUID();
            const assistantMessage: Message = {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setIsLoading(false);
            setIsStreaming(true);

            // 4. Process the SSE (Server-Sent Events) Stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let accumulatedText = '';

            while (!done) {
                const { value, done: streamDone } = await reader.read();
                done = streamDone;

                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    accumulatedText += chunk;

                    // Update the last message with the newly accumulated text
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastMsgIndex = newMessages.findIndex(m => m.id === assistantMessageId);

                        if (lastMsgIndex !== -1) {
                            newMessages[lastMsgIndex] = {
                                ...newMessages[lastMsgIndex],
                                content: accumulatedText,
                            };
                        }
                        return newMessages;
                    });
                }
            }

        } catch (err: any) {
            // Ignore errors caused by manual abortion
            if (err.name !== 'AbortError') {
                setError(err.message || 'Unknown error occurred');
                console.error('Chat interaction failed:', err);
            }
        } finally {
            // Reset loading states and cleanup controller
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    }, []);

    return {
        messages,
        sendMessage,
        isLoading,
        isStreaming,
        error,
    };
}