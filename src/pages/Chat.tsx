import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Phone, Video, Bot, Sparkles, MessageSquare, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import ChatBubble from '../components/chat/ChatBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { sendMessage as sendChatAPI } from '../service/chatService';

import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const ADMIN_EMAIL = 'admin@gmail.com';

type AIMessage = { role: 'user' | 'assistant'; content: string };

const Chat: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        activeMessages,
        setActivePartner,
        sendMessage: sendP2PMessage,
        loadMoreHistory,
        hasMoreHistory,
        isLoadingHistory
    } = useChat();
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef<number | null>(null);

    // Duo mode states
    const [mode, setMode] = useState<'ai' | 'admin'>('ai');
    const [aiMessages, setAiMessages] = useState<AIMessage[]>([
        {
            role: 'assistant',
            content: 'Xin chào! 👋 Tôi là trợ lý AI của **Bông Cosmetic**. Tôi có thể giúp gì cho bạn hôm nay?'
        },
    ]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [displayContent, setDisplayContent] = useState<Record<number, string>>({});
    const typingIntervals = useRef<Record<number, any>>({});
    const [input, setInput] = useState('');

    // Initialize partner on mount
    useEffect(() => {
        if (mode === 'admin') {
            setActivePartner(ADMIN_EMAIL);
        } else {
            setActivePartner(null);
        }
        return () => setActivePartner(null);
    }, [mode, setActivePartner]);

    // Typing effect for AI
    useEffect(() => {
        const lastMsg = aiMessages[aiMessages.length - 1];
        if (lastMsg?.role === 'assistant' && !displayContent[aiMessages.length - 1]) {
            let i = 0;
            const fullContent = lastMsg.content;
            const msgIdx = aiMessages.length - 1;

            if (typingIntervals.current[msgIdx]) clearInterval(typingIntervals.current[msgIdx]);

            typingIntervals.current[msgIdx] = setInterval(() => {
                setDisplayContent(prev => ({
                    ...prev,
                    [msgIdx]: fullContent.slice(0, i + 1)
                }));
                i++;
                if (i >= fullContent.length) {
                    clearInterval(typingIntervals.current[msgIdx]);
                }
            }, 10);
        }
    }, [aiMessages, displayContent]);

    // Scroll to bottom or restore scroll position
    useEffect(() => {
        if (scrollRef.current) {
            if (prevScrollHeightRef.current !== null) {
                const heightDiff = scrollRef.current.scrollHeight - prevScrollHeightRef.current;
                scrollRef.current.scrollTop = heightDiff;
                prevScrollHeightRef.current = null;
            } else {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [aiMessages, activeMessages, displayContent, mode]);

    const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        if (mode !== 'admin') return;
        const target = e.target as HTMLDivElement;
        if (target.scrollTop === 0 && hasMoreHistory && !isLoadingHistory) {
            prevScrollHeightRef.current = target.scrollHeight;
            await loadMoreHistory();
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = input.trim();
        if (!content) return;

        setInput('');

        if (mode === 'ai') {
            if (isLoadingAI) return;
            const newUserMsg: AIMessage = { role: 'user', content: content.trim() };
            setAiMessages(prev => [...prev, newUserMsg]);
            setInput('');
            setIsLoadingAI(true);

            try {
                // Send up to last 10 messages for context
                const historyStr = aiMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
                const data = await sendChatAPI(content, historyStr);
                const newAssistantMsg: AIMessage = {
                    role: 'assistant',
                    content: data.data?.response || data.response || 'Xin lỗi, tôi không nhận được phản hồi.'
                };
                setAiMessages(prev => [...prev, newAssistantMsg]);
            } catch (error) {
                console.error('AI Chat error:', error);
                setAiMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, đã có lỗi xảy ra khi kết nối tới AI 😔' }]);
            } finally {
                setIsLoadingAI(false);
            }
        } else {
            sendP2PMessage(content);
        }
    };

    return (
        <div className="flex flex-col bg-background overflow-hidden font-sans" style={{ height: 'calc(100dvh - 140px)' }}>

            <div className="flex-1 min-h-0 max-w-3xl mx-auto w-full flex flex-col border-x border-border bg-white shadow-2xl relative">
                {/* Duo Mode Header */}
                <div className="flex flex-col bg-gradient-to-tr from-pink-50 to-rose-50/30 border-b border-border/50 shrink-0">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 lg:hidden"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200/50">
                                {mode === 'ai' ? <Sparkles className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground tracking-tight">
                                    {mode === 'ai' ? 'Trợ lý Bông AI' : 'Hỗ trợ trực tiếp'}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Trực tuyến</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400">
                                <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400">
                                <Video className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Mode Toggle Tabs */}
                    <div className="px-4 pb-3">
                        <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-white/50 backdrop-blur-sm">
                            <button
                                onClick={() => setMode('ai')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[14px] text-xs font-bold transition-all duration-300",
                                    mode === 'ai'
                                        ? "bg-white text-primary shadow-sm scale-[1.02]"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Sparkles className={cn("h-3.5 w-3.5", mode === 'ai' ? "text-primary" : "text-muted-foreground")} />
                                AI Trợ lý
                            </button>
                            <button
                                onClick={() => setMode('admin')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[14px] text-xs font-bold transition-all duration-300",
                                    mode === 'admin'
                                        ? "bg-white text-primary shadow-sm scale-[1.02]"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <MessageSquare className={cn("h-3.5 w-3.5", mode === 'admin' ? "text-primary" : "text-muted-foreground")} />
                                Hỗ trợ trực tiếp
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6 bg-gradient-to-b from-transparent to-pink-50/10"
                >
                    <AnimatePresence mode="wait">
                        {mode === 'ai' ? (
                            <motion.div
                                key="ai-mode"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-6"
                            >
                                {aiMessages.map((msg, idx) => (
                                    <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                        {msg.role === 'assistant' && (
                                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shrink-0 mt-auto shadow-md">
                                                <Bot className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "max-w-[85%] px-4 py-3 rounded-[22px] shadow-sm text-sm leading-relaxed",
                                            msg.role === 'user'
                                                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-none"
                                                : "bg-white border border-slate-100 text-slate-800 rounded-bl-none prose prose-sm prose-pink"
                                        )}>
                                            {msg.role === 'assistant' ? (
                                                <ReactMarkdown
                                                    components={{
                                                        a: ({ node, ...props }) => (
                                                            <Link 
                                                                to={props.href || "#"} 
                                                                className="text-pink-600 underline hover:text-pink-700 font-bold"
                                                            >
                                                                {props.children}
                                                            </Link>
                                                        )
                                                    }}
                                                >
                                                    {displayContent[idx] || (idx === 0 ? msg.content : '')}
                                                </ReactMarkdown>
                                            ) : msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoadingAI && <TypingIndicator />}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="admin-mode"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-6"
                            >
                                {activeMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                        <MessageSquare className="h-16 w-16 mb-4 text-pink-300" />
                                        <p className="text-sm font-medium">Bắt đầu trò chuyện với nhân viên tư vấn</p>
                                    </div>
                                ) : (
                                    <>
                                        {isLoadingHistory && mode === 'admin' && (
                                            <div className="flex justify-center py-2">
                                                <span className="text-[10px] text-slate-400 font-bold loading-dots">Đang tải tin nhắn cũ...</span>
                                            </div>
                                        )}
                                        {activeMessages.map((msg, i) => {
                                            const isOwn = msg.senderEmail === user?.email;
                                            const showAvatar = i === 0 || activeMessages[i - 1]?.senderEmail !== msg.senderEmail;
                                            return (
                                                <ChatBubble
                                                    key={i}
                                                    content={msg.content}
                                                    isOwn={isOwn}
                                                    timestamp={msg.timestamp}
                                                    isRead={true}
                                                    showAvatar={showAvatar}
                                                    avatarFallback={isOwn ? (user?.email?.charAt(0).toUpperCase() || 'U') : 'AD'}
                                                />
                                            );
                                        })}
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="p-3 md:p-6 bg-white border-t border-border shrink-0 pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-6">
                    <form onSubmit={handleSend} className="relative group">
                        <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-pink-500/10 focus-within:border-pink-500/30 rounded-[24px] border border-transparent px-4 py-1.5 transition-all duration-300 shadow-inner">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={mode === 'ai' ? "Hỏi trợ lý Bông AI..." : "Nhập lời nhắn cho admin..."}
                                className="flex-1 bg-transparent text-sm py-2.5 focus:outline-none placeholder:text-slate-400"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={(mode === 'ai' && isLoadingAI) || !input.trim()}
                                className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-200/50 border-0 shrink-0 transition-transform active:scale-95"
                            >
                                <Send className="h-4 w-4 text-white" />
                            </Button>
                        </div>
                    </form>
                    <p className="text-[10px] text-center text-slate-400 mt-4 uppercase tracking-[0.2em] font-bold">
                        Bông Cosmetic ✨ Trải nghiệm làm đẹp thông minh
                    </p>
                </div>
            </div>

        </div>
    );
};

export default Chat;
