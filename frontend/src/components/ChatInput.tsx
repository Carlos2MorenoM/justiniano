import React, { useState, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    disabled?: boolean;
}

/**
 * ChatInput Component.
 * Fixed bottom bar for user text entry.
 * Handles local state and submission events.
 */
export const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    isLoading,
    disabled = false
}) => {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim() && !isLoading && !disabled) {
            onSend(input);
            setInput(''); // Clear input after sending
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-full bg-white border-t border-corpus-muted p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="max-w-4xl mx-auto flex items-center gap-3">

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Consulte sobre legislación (Ej: ¿Qué ayudas hay para placas solares?)"
                    disabled={disabled || isLoading}
                    className="flex-1 bg-corpus-base border-0 rounded-xl px-5 py-4 focus:ring-2 focus:ring-corpus-accent/50 focus:outline-none transition-all placeholder:text-gray-400 text-corpus-text"
                />

                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || disabled}
                    className="bg-corpus-structure text-white p-4 rounded-xl hover:bg-corpus-structure/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                    aria-label="Send Message"
                >
                    {isLoading ? (
                        <Loader2 size={24} className="animate-spin" />
                    ) : (
                        <Send size={24} />
                    )}
                </button>

            </div>

            {/* Footer / Disclaimer */}
            <div className="text-center mt-2">
                <p className="text-xs text-gray-400">
                    Justiniano puede cometer errores. Verifique la información con el BOE oficial.
                </p>
            </div>
        </div>
    );
};