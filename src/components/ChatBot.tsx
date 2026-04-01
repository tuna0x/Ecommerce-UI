import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Message = { role: 'user' | 'assistant'; content: string };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const hasChatConfig = Boolean(supabaseUrl && supabaseKey);
const CHAT_URL = hasChatConfig ? `${supabaseUrl}/functions/v1/chat` : null;
const CHAT_UNAVAILABLE_MESSAGE = 'Chat hỗ trợ đang tạm thời bảo trì. Vui lòng thử lại sau hoặc liên hệ hotline để được hỗ trợ nhanh hơn.';

const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: hasChatConfig
                ? 'Xin chào! 👋 Tôi là trợ lý ảo của **BeautyLux**. Tôi có thể giúp gì cho bạn hôm nay?'
                : CHAT_UNAVAILABLE_MESSAGE,
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current && hasChatConfig) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const streamAssistantReply = async (allMessages: Message[]) => {
        if (!CHAT_URL || !supabaseKey) {
            setMessages((prev) => [...prev, { role: 'assistant', content: CHAT_UNAVAILABLE_MESSAGE }]);
            return;
        }

        let assistantSoFar = '';

        const resp = await fetch(CHAT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ messages: allMessages }),
        });

        if (!resp.ok || !resp.body) {
            throw new Error('Stream failed');
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            textBuffer += decoder.decode(value, { stream: true });

            let newlineIndex: number;
            while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
                let line = textBuffer.slice(0, newlineIndex);
                textBuffer = textBuffer.slice(newlineIndex + 1);
                if (line.endsWith('\r')) line = line.slice(0, -1);
                if (line.startsWith(':') || line.trim() === '') continue;
                if (!line.startsWith('data: ')) continue;

                const jsonStr = line.slice(6).trim();
                if (jsonStr === '[DONE]') break;

                try {
                    const parsed = JSON.parse(jsonStr);
                    const content = parsed.choices?.[0]?.delta?.content as string | undefined;
                    if (content) {
                        assistantSoFar += content;
                        const snapshot = assistantSoFar;
                        setMessages((prev) => {
                            const last = prev[prev.length - 1];
                            if (last?.role === 'assistant' && prev.length > allMessages.length) {
                                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snapshot } : m));
                            }
                            return [...prev, { role: 'assistant', content: snapshot }];
                        });
                    }
                } catch {
                    textBuffer = line + '\n' + textBuffer;
                    break;
                }
            }
        }
    };

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMsg: Message = { role: 'user', content: trimmed };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            await streamAssistantReply(updatedMessages);
        } catch (err) {
            console.error('Chat error:', err);
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau! 😔' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickQuestions = [
        'Tư vấn skincare cho da dầu',
        'Chính sách đổi trả',
        'Khuyến mãi hiện có',
    ];

    const handleQuickQuestion = async (question: string) => {
        if (isLoading) return;

        const userMsg: Message = { role: 'user', content: question };
        const allMessages = [...messages, userMsg];
        setMessages(allMessages);
        setIsLoading(true);

        try {
            await streamAssistantReply(allMessages);
        } catch {
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Xin lỗi, đã có lỗi xảy ra. 😔' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50"
                    >
                        <Button
                            onClick={() => setIsOpen(true)}
                            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
                            size="icon"
                        >
                            <MessageCircle className="h-6 w-6" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
                            <div className="flex items-center gap-2">
                                <Bot className="h-5 w-5" />
                                <div>
                                    <p className="text-sm font-semibold">BeautyLux Assistant</p>
                                    <p className="text-xs opacity-80">Luôn sẵn sàng hỗ trợ bạn</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                            <div className="space-y-4">
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <Bot className="h-4 w-4 text-primary" />
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                                                msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-br-md'
                                                    : 'bg-muted text-foreground rounded-bl-md'
                                            )}
                                        >
                                            {msg.role === 'assistant' ? (
                                                <div className="prose prose-sm max-w-none [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p>{msg.content}</p>
                                            )}
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                                    <div className="flex gap-2 justify-start">
                                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Bot className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                    </div>
                                )}

                                {messages.length === 1 && hasChatConfig && (
                                    <div className="space-y-2 mt-2">
                                        <p className="text-xs text-muted-foreground">Câu hỏi phổ biến:</p>
                                        {quickQuestions.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => void handleQuickQuestion(q)}
                                                className="block w-full text-left text-xs border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void sendMessage();
                            }}
                            className="flex items-center gap-2 p-3 border-t border-border"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={hasChatConfig ? 'Nhập tin nhắn...' : 'Chat đang tạm bảo trì'}
                                disabled={isLoading || !hasChatConfig}
                                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || isLoading || !hasChatConfig}
                                className="h-9 w-9 rounded-full shrink-0"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatBot;

