import React, { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Logo } from './Logo';

/**
 * ChatInterface Container.
 * Orchestrates the chat view, connecting the logic hook (useChat) with the UI components.
 * Manages auto-scrolling to the latest message.
 */
export const ChatInterface: React.FC = () => {
    const { messages, sendMessage, isLoading, isStreaming, error } = useChat();

    // Ref for auto-scrolling to the bottom
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Effect: Scroll to bottom whenever messages change (new message or streaming update)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    // --- EMPTY STATE (Welcome Screen) ---
    if (messages.length === 0) {
        return (
            <div className="flex flex-col h-screen bg-corpus-base">
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
                    <div className="animate-fade-in-up">
                        <Logo size={100} />
                    </div>
                    <div className="max-w-lg space-y-4">
                        <h1 className="text-4xl font-serif text-corpus-structure">
                            Justiniano
                        </h1>
                        <p className="text-lg text-gray-600">
                            Su asistente legal experto en el BOE.
                            <br />
                            <span className="text-sm italic opacity-75">
                                Potenciado por RAG & LLMs Locales.
                            </span>
                        </p>
                    </div>
                </div>
                {/* Input at the bottom */}
                <ChatInput onSend={sendMessage} isLoading={isLoading} />
            </div>
        );
    }

    // --- CHAT STATE (Active Conversation) ---
    return (
        <div className="flex flex-col h-screen bg-corpus-base">

            {/* Header (Simplified) */}
            <header className="bg-white/80 backdrop-blur-md border-b border-corpus-muted p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <Logo size={32} />
                    <span className="font-serif text-corpus-structure font-bold text-lg">
                        Justiniano
                    </span>
                </div>
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
                <div className="max-w-4xl mx-auto space-y-6 pb-4">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}

                    {/* Error Bubble */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm text-center mx-auto max-w-md">
                            <p>⚠️ {error}</p>
                        </div>
                    )}

                    {/* Invisible div to scroll to */}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <ChatInput
                onSend={sendMessage}
                isLoading={isLoading && !isStreaming} // Only block if waiting for connection, not while streaming
                disabled={isStreaming} // Optionally disable while streaming to avoid race conditions
            />
        </div>
    );
};