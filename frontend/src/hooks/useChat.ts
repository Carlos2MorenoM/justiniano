import { useState, useCallback, useRef } from 'react';
import type { Message } from '../types/chat';

// TODO: Use environment variables for production API URL
const BASE_URL = 'https://backend-bff-production.up.railway.app';

// 2. Construct the full endpoint URL, ensuring no double slashes.
const API_URL = `${BASE_URL.replace(/\/$/, '')}/chat`;

export type UserTier = 'free' | 'pro';

/**
 * Custom hook to manage chat state and API communication.
 */
export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentTier, setCurrentTier] = useState<UserTier>('free');
    const [lastMetrics, setLastMetrics] = useState<{ latencyMs?: number }>({});

    const abortControllerRef = useRef<AbortController | null>(null);

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
        setLastMetrics({});

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const startTime = performance.now();
        const assistantMessageId = crypto.randomUUID();

        try {
            // 2. Request to Backend
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-tier': currentTier,
                    'x-user-id': 'tester-frontend',
                },
                body: JSON.stringify({ message: content, messageId: assistantMessageId }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) throw new Error('Connection to Justiniano failed');
            if (!response.body) throw new Error('Streaming not supported');

            // 3. Calculate Latency (Time to First Byte)
            const endTime = performance.now();
            setLastMetrics({ latencyMs: Math.round(endTime - startTime) });

            // 4. Prepare Assistant Message
            const assistantMessage: Message = {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                metadata: {
                    model: currentTier === 'pro' ? 'Gemma 2 (12B)' : 'Llama 3.1 (8B)',
                    tier: currentTier
                }
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setIsLoading(false);
            setIsStreaming(true);

            // 5. Process the SSE (Server-Sent Events) Stream
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

        } catch (err: unknown) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError(err.message || 'Unknown error');
                console.error('Chat error:', err);
            } else if (err instanceof Error && err.name === 'AbortError') {
                // Ignore abort errors
            } else if (!(err instanceof Error)) {
                setError('Unknown error');
                console.error('Chat error:', err);
            }
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    }, [currentTier]);

    return {
        messages,
        sendMessage,
        isLoading,
        isStreaming,
        error,
        currentTier,
        setTier: setCurrentTier,
        lastMetrics
    };
}