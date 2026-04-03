import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Smile } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, placeholder = 'Nhập tin nhắn...' }) => {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setValue('');
        inputRef.current?.focus();
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 p-3 border-t border-border bg-white/80"
        >
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-primary shrink-0"
            >
                <ImageIcon className="h-5 w-5" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-primary shrink-0"
            >
                <Smile className="h-5 w-5" />
            </Button>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    'flex-1 bg-accent/50 rounded-full px-4 py-2.5 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30',
                    'placeholder:text-muted-foreground/60 disabled:opacity-50',
                    'border border-border'
                )}
            />
            <Button
                type="submit"
                size="icon"
                disabled={!value.trim() || disabled}
                className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-md shrink-0 disabled:opacity-40"
            >
                <Send className="h-4 w-4 text-white" />
            </Button>
        </form>
    );
};

export default ChatInput;
