import React, { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Logo } from './Logo';
import { ObservabilityPanel } from './ObservabilityPanel';

/**
 * ChatInterface Component.
 * Orchestrates the chat view and the observability side panel.
 * Designed to fit within a parent layout container (h-full).
 */
export const ChatInterface: React.FC = () => {
    // Extract chat state and logic from the custom hook
    const {
        messages,
        sendMessage,
        isLoading,
        isStreaming,
        error,
        currentTier,
        setTier,
        lastMetrics,
    } = useChat();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Identify the last assistant message to populate the observability panel
    const lastAssistantMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'assistant');

    // Auto-scroll to bottom when new messages arrive or streaming updates occur
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    return (
        // Root container adapts to the parent layout dimensions (DashboardLayout)
        <div className="flex h-full w-full bg-corpus-base overflow-hidden">
            {/* --- Main Chat Area --- */}
            {/* 'mr-12' provides spacing for the collapsed state of the ObservabilityPanel */}
            <div className="flex-1 flex flex-col h-full relative transition-all duration-300 mr-12">
                {/* Sticky Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-corpus-muted p-4 sticky top-0 z-10 shadow-sm">
                    <div className="max-w-4xl mx-auto flex items-center gap-3">
                        <Logo size={32} />
                        <span className="font-serif text-corpus-structure font-bold text-lg">
                            Justiniano
                        </span>
                    </div>
                </header>

                {/* Scrollable Message List */}
                <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
                    <div className="max-w-4xl mx-auto space-y-6 pb-4">
                        {/* Empty State / Welcome Screen */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 opacity-80">
                                <Logo size={80} />
                                <div className="max-w-md space-y-2">
                                    <h2 className="text-2xl font-serif text-corpus-structure">
                                        Bienvenido al Archivo
                                    </h2>
                                    <p className="text-gray-600">
                                        Seleccione su nivel de acceso en el panel lateral y comience
                                        su consulta legal.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Message History */}
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}

                        {/* Error Feedback */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm text-center mx-auto max-w-md animate-pulse">
                                <p>⚠️ {error}</p>
                            </div>
                        )}

                        {/* Scroll Anchor */}
                        <div ref={messagesEndRef} />
                    </div>
                </main>

                {/* Input Area */}
                <ChatInput
                    onSend={sendMessage}
                    isLoading={isLoading && !isStreaming}
                    disabled={isStreaming}
                />
            </div>

            {/* --- Right Sidebar: Observability Panel --- */}
            <ObservabilityPanel
                currentTier={currentTier}
                onTierChange={setTier}
                metrics={lastMetrics}
                lastMessageMeta={lastAssistantMessage?.metadata}
                lastMessageContent={lastAssistantMessage?.content}
            />
        </div>
    );
};