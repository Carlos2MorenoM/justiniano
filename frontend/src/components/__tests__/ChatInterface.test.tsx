import { render, screen } from '@testing-library/react';
import { ChatInterface } from '../ChatInterface';
import { vi, describe, it, expect } from 'vitest';
import * as useChatHook from '../../hooks/useChat';
import '@testing-library/jest-dom';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('ChatInterface', () => {
    it('renders welcome screen when no messages', () => {
        vi.spyOn(useChatHook, 'useChat').mockReturnValue({
            messages: [],
            sendMessage: vi.fn(),
            isLoading: false,
            isStreaming: false,
            error: null,
        });

        render(<ChatInterface />);
        expect(screen.getByText('Justiniano')).toBeInTheDocument();
        expect(screen.getByText(/Su asistente legal experto/i)).toBeInTheDocument();
    });

    it('renders messages when there are messages', () => {
        vi.spyOn(useChatHook, 'useChat').mockReturnValue({
            messages: [
                { id: '1', role: 'user', content: 'Hi', timestamp: new Date() },
                { id: '2', role: 'assistant', content: 'Hello', timestamp: new Date() }
            ],
            sendMessage: vi.fn(),
            isLoading: false,
            isStreaming: false,
            error: null,
        });

        render(<ChatInterface />);
        expect(screen.getByText('Hi')).toBeInTheDocument();
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });
});
