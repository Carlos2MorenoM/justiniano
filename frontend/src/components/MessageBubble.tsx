import React from 'react';
import { User, Scale } from 'lucide-react';

import { twMerge } from 'tailwind-merge';
import type { Message } from '../types/chat';

interface MessageBubbleProps {
    message: Message;
}

/**
 * MessageBubble Component.
 * Renders a single chat message with distinctive styling for User vs Assistant.
 * * - **User**: Purple background, right-aligned (The querist).
 * - **Assistant**: White background, gold accent, left-aligned (The authority).
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div
            className={twMerge(
                "flex w-full mb-6",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={twMerge(
                    "flex max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm",
                    // Conditional Styling based on Role
                    isUser
                        ? "bg-corpus-structure text-white rounded-br-sm" // User: Imperial Purple
                        : "bg-white text-corpus-text border-l-4 border-corpus-accent rounded-bl-sm" // Assistant: Document style with Gold border
                )}
            >
                {/* Icon Column */}
                <div className="mr-4 flex-shrink-0 mt-1">
                    <div className={twMerge(
                        "p-2 rounded-full",
                        isUser ? "bg-white/10" : "bg-corpus-base"
                    )}>
                        {isUser ? (
                            <User size={20} className="text-white" />
                        ) : (
                            <Scale size={20} className="text-corpus-structure" />
                        )}
                    </div>
                </div>

                {/* Content Column */}
                <div className="flex-1 overflow-hidden">
                    {/* Header Name */}
                    <p className={twMerge(
                        "text-xs font-bold mb-1 uppercase tracking-wider",
                        isUser ? "text-white/70" : "text-corpus-accent"
                    )}>
                        {isUser ? "Consultante" : "Justiniano"}
                    </p>

                    {/* Message Body - preserve whitespace for formatting */}
                    <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                        {message.content}
                    </div>

                    {/* Metadata Footer (Model used, timestamps, etc) */}
                    {message.metadata && !isUser && (
                        <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-2">
                            <span>Model: {message.metadata.model || 'Unknown'}</span>
                            <span>•</span>
                            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};