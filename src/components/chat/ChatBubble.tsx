import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';

interface ChatBubbleProps {
    content: string;
    isOwn: boolean;
    timestamp: string;
    isRead?: boolean;
    showAvatar?: boolean;
    avatarFallback?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
    content,
    isOwn,
    timestamp,
    isRead,
    showAvatar,
    avatarFallback,
}) => {
    const time = new Date(timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={cn('flex gap-2 mb-4', isOwn ? 'justify-end' : 'justify-start')}
        >
            {/* Left avatar area - always takes space for alignment */}
            {!isOwn && (
                <div className="w-9 shrink-0 flex items-end justify-center">
                    {showAvatar ? (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-sm">
                            <span className="text-xs font-semibold text-white">
                                {avatarFallback || 'B'}
                            </span>
                        </div>
                    ) : null}
                </div>
            )}

            <div className="max-w-[70%]">
                <div
                    className={cn(
                        'px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                        isOwn
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl rounded-br-md'
                            : 'bg-card text-foreground rounded-2xl rounded-bl-md border border-border'
                    )}
                >
                    {content}
                </div>
                <div
                    className={cn(
                        'flex items-center gap-1 mt-1 text-[10px] text-muted-foreground',
                        isOwn ? 'justify-end' : 'justify-start'
                    )}
                >
                    <span>{time}</span>
                    {isOwn && (
                        isRead ? (
                            <CheckCheck className="h-3 w-3 text-primary" />
                        ) : (
                            <Check className="h-3 w-3" />
                        )
                    )}
                </div>
            </div>

            {/* Right avatar area - always takes space for alignment */}
            {isOwn && (
                <div className="w-9 shrink-0 flex items-end justify-center">
                    {showAvatar ? (
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs font-medium text-muted-foreground">
                                {avatarFallback || 'U'}
                            </span>
                        </div>
                    ) : null}
                </div>
            )}
        </motion.div>
    );
};

export default ChatBubble;
