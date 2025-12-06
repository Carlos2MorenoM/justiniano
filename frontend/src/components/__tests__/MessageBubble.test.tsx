import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import type { Message } from '../../types/chat';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

describe('MessageBubble', () => {
    const mockDate = new Date('2023-01-01T12:00:00');

    it('renders user message correctly', () => {
        const message: Message = {
            id: '1',
            role: 'user',
            content: 'Hello Justiniano',
            timestamp: mockDate,
        };

        render(<MessageBubble message={message} />);

        expect(screen.getByText('Hello Justiniano')).toBeInTheDocument();
        expect(screen.getByText('Consultante')).toBeInTheDocument();
    });

    it('renders assistant message correctly', () => {
        const message: Message = {
            id: '2',
            role: 'assistant',
            content: 'Hello User',
            timestamp: mockDate,
        };

        render(<MessageBubble message={message} />);

        expect(screen.getByText('Hello User')).toBeInTheDocument();
        expect(screen.getByText('Justiniano')).toBeInTheDocument();
    });
});
