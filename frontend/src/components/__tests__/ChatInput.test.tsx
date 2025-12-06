import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '../ChatInput';
import { vi, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

describe('ChatInput', () => {
    it('renders input and button', () => {
        render(<ChatInput onSend={() => { }} isLoading={false} />);
        expect(screen.getByPlaceholderText(/Consulte sobre legislación/i)).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls onSend when button is clicked', () => {
        const handleSend = vi.fn();
        render(<ChatInput onSend={handleSend} isLoading={false} />);

        const input = screen.getByPlaceholderText(/Consulte sobre legislación/i);
        fireEvent.change(input, { target: { value: 'Test message' } });

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(handleSend).toHaveBeenCalledWith('Test message');
    });

    it('calls onSend when Enter is pressed', () => {
        const handleSend = vi.fn();
        render(<ChatInput onSend={handleSend} isLoading={false} />);

        const input = screen.getByPlaceholderText(/Consulte sobre legislación/i);
        fireEvent.change(input, { target: { value: 'Test message' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

        expect(handleSend).toHaveBeenCalledWith('Test message');
    });

    it('does not send empty message', () => {
        const handleSend = vi.fn();
        render(<ChatInput onSend={handleSend} isLoading={false} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(handleSend).not.toHaveBeenCalled();
    });

    it('is disabled when loading', () => {
        render(<ChatInput onSend={() => { }} isLoading={true} />);
        expect(screen.getByPlaceholderText(/Consulte sobre legislación/i)).toBeDisabled();
        expect(screen.getByRole('button')).toBeDisabled();
    });
});
