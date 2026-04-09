import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Bot, Sparkles, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessage as sendChatAPI } from '../service/chatService';
import TypingIndicator from '../components/chat/TypingIndicator';

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_UNAVAILABLE = 'Chat hỗ trợ đang tạm thời bảo trì. Vui lòng thử lại sau 💕';

const quickQuestions = [
    { label: '💄 Gợi ý sản phẩm', value: 'Gợi ý sản phẩm phù hợp cho mình' },
    { label: '🔥 Bán chạy nhất', value: 'Sản phẩm bán chạy nhất hiện tại' },
    { label: '🧴 Tư vấn skincare', value: 'Tư vấn skincare cho da dầu mụn' },
];

const ChatBot: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Xin chào! 👋 Chào mừng bạn đến **Tuna Ecommerce**! Tôi là trợ lý AI, tôi có thể giúp gì cho bạn hôm nay?'
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const sendMessage = async (content: string) => {
        if (isLoading || !content.trim()) return;
        
        const userMsg: Message = { role: 'user', content: content.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const data = await sendChatAPI(content);
            const assistantMsg: Message = { 
                role: 'assistant', 
                content: data.data?.response || data.response || 'Xin lỗi, tôi không nhận được phản hồi.' 
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, đã có lỗi xảy ra khi kết nối tới máy chủ 😔' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void sendMessage(input);
    };

    return (
        <>
            {/* Floating button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50"
                    >
                        <Button
                            onClick={() => {
                                if (!isAuthenticated) {
                                    navigate('/login');
                                } else {
                                    setIsOpen(true);
                                }
                            }}
                            className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500 hover:from-pink-600 hover:via-rose-600 hover:to-fuchsia-600 border-0 relative overflow-hidden"
                            size="icon"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_60%)]" />
                            <Sparkles className="h-6 w-6 text-white relative z-10" />
                        </Button>
                        <span className="absolute inset-0 rounded-full animate-ping bg-pink-400/25 pointer-events-none" />
                        {/* Label tooltip */}
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg"
                        >
                            AI Trợ lý 🤖
                            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-foreground" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-8rem)] flex flex-col rounded-3xl border border-border/50 bg-background shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative px-5 py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
                                        <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white tracking-wide">AI Trợ lý</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                                            <p className="text-xs text-white/75">Luôn sẵn sàng hỗ trợ</p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15 rounded-xl"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-pink-50/30 to-background">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="flex gap-2.5 justify-start">
                                            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shrink-0 mt-auto shadow-sm">
                                                <Bot className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <div className="max-w-[78%] bg-card border border-border/50 rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-sm">
                                                <div className="prose prose-sm max-w-none text-sm [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1 [&_strong]:text-primary">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 justify-end">
                                            <div className="max-w-[78%] bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl rounded-br-md px-3.5 py-2.5 shadow-md">
                                                <p className="text-sm">{msg.content}</p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {isLoading && messages[messages.length - 1]?.role === 'user' && (
                                <TypingIndicator />
                            )}

                            {/* Quick questions */}
                            {messages.length === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-4 space-y-2"
                                >
                                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Gợi ý cho bạn</p>
                                    {quickQuestions.map((q) => (
                                        <motion.button
                                            key={q.value}
                                            whileHover={{ scale: 1.02, x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => void sendMessage(q.value)}
                                            className="flex items-center gap-2 w-full text-left text-xs border border-border rounded-xl px-3.5 py-2.5 hover:bg-accent hover:border-primary/30 transition-all bg-card text-foreground shadow-sm"
                                        >
                                            {q.label}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-card/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2 bg-background rounded-2xl border border-border px-4 py-1 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Hỏi mình bất cứ điều gì..."
                                    className="flex-1 bg-transparent text-sm py-2.5 focus:outline-none placeholder:text-muted-foreground disabled:opacity-50"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={isLoading || !input.trim()}
                                    className="h-8 w-8 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-30 border-0 shrink-0"
                                >
                                    <Send className="h-3.5 w-3.5 text-white" />
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground text-center mt-2">
                                Powered by Gemini AI · Tuna Ecommerce ✨
                            </p>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatBot;
