import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { X, Bot, Sparkles, Send, MessageSquare, ShieldCheck, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessage as sendChatAPI, uploadChatImage } from '../service/chatService';
import TypingIndicator from '../components/chat/TypingIndicator';
import { cn } from '../lib/utils';

type Message = { role: 'user' | 'assistant' | 'admin'; content: string; timestamp?: string };

const quickQuestions = [
    { label: '🔥 Đang Flashsale', value: 'Có sản phẩm nào đang flashsale hay gỉảm giá không?' },
    { label: '🛒 Xem Giỏ Hàng', value: 'Trong giỏ hàng của tôi đang có những gì?' },
    { label: '📦 Tình trạng đơn', value: 'Đơn hàng của tôi bao giờ giao?' },
    { label: '🎟️ Lấy mã giảm giá', value: 'Cho mình xin mã giảm giá hiện có với' },
];

const ADMIN_EMAIL = 'admin@gmail.com';

// --- Sub-components (outside for better memoization) ---

const ProductMiniCard = ({ data, onNavigate }: { data: string, onNavigate: (id: string) => void }) => {
    const [id, name, price, thumbnail] = data.split('|');
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onNavigate(id)}
            className="flex items-center gap-3 p-3 bg-white border border-pink-100 rounded-2xl my-2 cursor-pointer hover:border-pink-300 transition-all shadow-sm group text-left"
        >
            <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                <img src={thumbnail || '/placeholder-product.png'} alt={name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-800 truncate mb-0.5">{name}</p>
                <p className="text-[12px] font-extrabold text-pink-600">{price} VNĐ</p>
                <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Xem chi tiết</span>
                    <Sparkles className="h-2.5 w-2.5 text-pink-400" />
                </div>
            </div>
        </motion.div>
    );
};

const MessageItem = React.memo(({ msg, shouldType, onNavigate }: { msg: Message, shouldType: boolean, onNavigate: (id: string) => void }) => {
    const { cleanText, tags } = useMemo(() => {
        const text = msg.content.replace(/\[PRODUCT_CARD:.*?\]/g, '').replace(/\[QUICK_REPLY:.*?\]/g, '');
        const cards = msg.content.match(/\[PRODUCT_CARD:(.*?)\]/g) || [];
        return { cleanText: text, tags: cards };
    }, [msg.content]);

    const [typingProgress, setTypingProgress] = useState(shouldType ? 0 : cleanText.length);

    useEffect(() => {
        if (shouldType && typingProgress < cleanText.length) {
            const timeout = setTimeout(() => {
                setTypingProgress(prev => prev + 1);
            }, 10);
            return () => clearTimeout(timeout);
        }
    }, [shouldType, typingProgress, cleanText.length]);

    const actualProgress = shouldType ? typingProgress : cleanText.length;
    const displayedText = cleanText.slice(0, actualProgress);
    const isTypingDone = actualProgress >= cleanText.length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}
        >
            {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shrink-0 mt-auto shadow-md">
                    <Bot className="h-4 w-4 text-white" />
                </div>
            )}
            <div className={cn(
                "max-w-[78%] flex flex-col gap-1",
                msg.role === 'user' ? "items-end" : "items-start"
            )}>
                <div className={cn(
                    "px-4 py-3 rounded-[20px] shadow-sm text-[13px] leading-relaxed",
                    msg.role === 'user'
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-none text-right"
                        : "bg-white border border-border/50 text-foreground rounded-bl-none prose prose-sm prose-pink text-left"
                )}>
                    {msg.role === 'assistant' ? (
                        <ReactMarkdown
                            components={{
                                a: ({ ...props }) => (
                                    <Link to={props.href || "#"} className="text-pink-600 underline hover:text-pink-700 font-bold">
                                        {props.children}
                                    </Link>
                                )
                            }}
                        >
                            {displayedText}
                        </ReactMarkdown>
                    ) : msg.content}
                </div>

                {msg.role === 'assistant' && isTypingDone && tags.map((match, i) => (
                    <ProductMiniCard key={i} data={match.replace('[PRODUCT_CARD:', '').replace(']', '')} onNavigate={onNavigate} />
                ))}
            </div>
        </motion.div>
    );
});

const isImageUrl = (url: string) => {
    if (typeof url !== 'string') return false;
    return (
        url.startsWith('http://') || url.startsWith('https://')
    ) && (
        url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) !== null || 
        url.includes('res.cloudinary.com')
    );
};

// --- Main Component ---

const ChatBot: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const {
        activeMessages,
        sendMessage: sendP2PMessage,
        setActivePartner,
        loadMoreHistory,
        hasMoreHistory,
        isLoadingHistory
    } = useChat();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragConstraints, setDragConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });

    useEffect(() => {
        const updateConstraints = () => {
            setDragConstraints({
                top: -window.innerHeight + 120,
                bottom: 16,
                left: -window.innerWidth + 100,
                right: 16
            });
        };
        updateConstraints();
        window.addEventListener('resize', updateConstraints);
        return () => window.removeEventListener('resize', updateConstraints);
    }, []);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const res = await uploadChatImage(file);
            if (res && res.url) {
                sendP2PMessage(res.url);
            }
        } catch (err) {
            console.error("Lỗi upload ảnh", err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const [mode, setMode] = useState<'ai' | 'admin'>('ai');
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Xin chào! 👋 Chào mừng bạn đến **Bông Cosmetic**! Tôi là trợ lý AI, tôi có thể giúp gì cho bạn hôm nay?'
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [contextQuickReplies, setContextQuickReplies] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const prevScrollHeightRef = useRef<number | null>(null);

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
    }, [messages, activeMessages, mode]);

    const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        if (mode !== 'admin') return;
        const target = e.target as HTMLDivElement;
        if (target.scrollTop <= 15 && hasMoreHistory && !isLoadingHistory) {
            prevScrollHeightRef.current = target.scrollHeight;
            await loadMoreHistory();
        }
    };

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'admin') {
                setActivePartner(ADMIN_EMAIL);
            } else {
                setActivePartner(null);
            }
        }
    }, [mode, isOpen, setActivePartner]);

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;

        if (mode === 'ai') {
            if (isLoading) return;
            const userMsg: Message = { role: 'user', content: content.trim() };
            setMessages(prev => [...prev, userMsg]);
            setInput('');
            setIsLoading(true);

            try {
                const historyStr = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
                const data = await sendChatAPI(content, historyStr);
                const rawResponse = data.data?.response || data.response || 'Xin lỗi, tôi không nhận được phản hồi.';

                const quickReplyMatch = rawResponse.match(/\[QUICK_REPLY:(.*?)\]/);
                if (quickReplyMatch) {
                    setContextQuickReplies(quickReplyMatch[1].split('|'));
                } else {
                    setContextQuickReplies([]);
                }

                const assistantMsg: Message = { role: 'assistant', content: rawResponse };
                setMessages(prev => [...prev, assistantMsg]);
            } catch (error) {
                console.error('Chat error:', error);
                setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, đã có lỗi xảy ra khi kết nối tới máy chủ 😔' }]);
            } finally {
                setIsLoading(false);
            }
        } else {
            sendP2PMessage(content.trim());
            setInput('');
        }
    };

    const handleNavigateProduct = (id: string) => {
        navigate(`/product/${id}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void handleSendMessage(input);
    };

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        drag
                        dragConstraints={dragConstraints}
                        dragElastic={0.15}
                        dragMomentum={true}
                        dragTransition={{ bounceStiffness: 200, bounceDamping: 18 }}
                        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
                        whileHover={{ scale: 1.05 }}
                        onDragStart={() => setIsDragging(true)}
                        onDragEnd={() => setIsDragging(false)}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 px-2 cursor-grab touch-none"
                    >
                        <Button
                            onClick={() => {
                                if (isDragging) return; // Prevent clicking during drag
                                if (!isAuthenticated) {
                                    navigate('/login');
                                } else {
                                    setIsOpen(true);
                                }
                            }}
                            className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500 hover:from-pink-600 hover:via-rose-600 hover:to-fuchsia-600 border-0 relative overflow-hidden group"
                            size="icon"
                        >
                            <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors" />
                            <Sparkles className="h-6 w-6 text-white relative z-10 animate-pulse" />
                        </Button>
                        <span className="absolute inset-0 rounded-full animate-ping bg-pink-400/25 pointer-events-none" />
                        {!isDragging && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg hidden md:block pointer-events-none"
                            >
                                Chat với Bông ✨
                                <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-foreground" />
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] flex flex-col rounded-[2.5rem] border border-border/50 bg-background shadow-2xl overflow-hidden"
                    >
                        <div className="relative pt-6 pb-2 px-6 bg-gradient-to-tr from-pink-50 to-rose-50/30 border-b border-border/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200/50">
                                        <Bot className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground tracking-tight">Trợ lý Bông Cosmetic</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Trực tuyến</p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 rounded-full hover:bg-secondary/80 text-muted-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex bg-secondary/50 p-1 rounded-2xl border border-border/30 backdrop-blur-sm">
                                <button
                                    onClick={() => setMode('ai')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[14px] text-xs font-bold transition-all duration-300",
                                        mode === 'ai'
                                            ? "bg-background text-primary shadow-sm scale-[1.02]"
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
                                            ? "bg-background text-primary shadow-sm scale-[1.02]"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <MessageSquare className={cn("h-3.5 w-3.5", mode === 'admin' ? "text-primary" : "text-muted-foreground")} />
                                    Nhân viên hỗ trợ
                                </button>
                            </div>
                        </div>

                        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-transparent to-pink-50/20">
                            {mode === 'ai' ? (
                                <>
                                    {messages.map((msg, idx) => (
                                        <MessageItem
                                            key={idx}
                                            msg={msg}
                                            shouldType={idx === messages.length - 1 && msg.role === 'assistant' && idx > 0}
                                            onNavigate={handleNavigateProduct}
                                        />
                                    ))}
                                    {isLoading && <TypingIndicator />}

                                    {messages.length > 1 && contextQuickReplies.length > 0 && !isLoading && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 mt-4">
                                            {contextQuickReplies.map((q, idx) => (
                                                <Button
                                                    key={idx}
                                                    variant="outline"
                                                    onClick={() => handleSendMessage(q)}
                                                    className="h-auto py-2 px-4 rounded-xl text-[11px] font-bold border-pink-200 text-pink-600 hover:bg-pink-50 transition-all bg-white/50"
                                                >
                                                    {q}
                                                </Button>
                                            ))}
                                        </motion.div>
                                    )}

                                    {messages.length === 1 && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2 mt-6">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-1">Gợi ý câu hỏi</p>
                                            {quickQuestions.map((q) => (
                                                <Button
                                                    key={q.value}
                                                    variant="outline"
                                                    onClick={() => handleSendMessage(q.value)}
                                                    className="w-full justify-start h-auto py-3 px-4 rounded-2xl text-xs hover:bg-pink-50 hover:text-primary hover:border-pink-200 transition-all border-dashed bg-card/50"
                                                >
                                                    {q.label}
                                                </Button>
                                            ))}
                                        </motion.div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="flex flex-col items-center py-6 px-4 bg-white/50 rounded-3xl border border-pink-100 mb-6">
                                        <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center mb-3">
                                            <ShieldCheck className="h-8 w-8 text-pink-500" />
                                        </div>
                                        <h3 className="text-sm font-bold text-foreground">Hỗ trợ trực tiếp</h3>
                                        <p className="text-[11px] text-muted-foreground text-center mt-1 px-4 leading-relaxed">
                                            Vui lòng nhắn tin, chúng tôi sẽ phản hồi bạn trong giây lát 💖
                                        </p>
                                    </div>

                                    {isLoadingHistory && mode === 'admin' && (
                                        <div className="flex justify-center py-2">
                                            <span className="text-[10px] text-slate-400 font-bold loading-dots">Đang tải tin nhắn cũ...</span>
                                        </div>
                                    )}

                                    {!hasMoreHistory && activeMessages.length > 0 && (
                                        <div className="flex flex-col items-center justify-center py-6 border-b border-dashed border-slate-200 mb-4 text-center">
                                            <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-2 shadow-sm shadow-slate-100">
                                                <MessageSquare className="h-5 w-5 text-pink-500 animate-pulse" />
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-700">Khởi đầu cuộc trò chuyện ✨</p>
                                            <p className="text-[10px] text-slate-400 mt-1 max-w-[220px] leading-relaxed font-medium">Đây là bắt đầu lịch sử trò chuyện giữa bạn và chúng tôi.</p>
                                        </div>
                                    )}

                                    {activeMessages.map((msg, idx) => {
                                        const isMine = msg.senderEmail === user?.email;
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={cn("flex gap-3", isMine ? "justify-end" : "justify-start")}
                                            >
                                                {!isMine && (
                                                    <div className="h-8 w-8 rounded-xl bg-pink-100 flex items-center justify-center shrink-0 mt-auto">
                                                        <span className="text-[10px] font-bold text-pink-500">AD</span>
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "max-w-[78%] px-4 py-3 rounded-[20px] shadow-sm text-[13px]",
                                                    isMine
                                                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-none text-right"
                                                        : "bg-white border border-border/50 text-foreground rounded-bl-none text-left",
                                                    isImageUrl(msg.content) && "p-1 bg-white border border-slate-100"
                                                )}>
                                                    {isImageUrl(msg.content) ? (
                                                        <img 
                                                            src={msg.content} 
                                                            alt="Chat Attachment" 
                                                            className="max-w-full max-h-[180px] object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                                                            onClick={() => window.open(msg.content, '_blank')}
                                                        />
                                                    ) : (
                                                        <p>{msg.content}</p>
                                                    )}
                                                    <p className={cn("text-[9px] mt-1.5 font-medium opacity-70", isMine ? "text-right" : "text-left")}>
                                                        {new Date(msg.timestamp || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {activeMessages.length === 0 && (
                                        <div className="text-center py-10">
                                            <p className="text-xs text-muted-foreground italic bg-secondary/30 py-2 px-4 rounded-full inline-block">Bắt đầu cuộc trò chuyện với Admin ✨</p>
                                        </div>
                                    )}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-5 bg-white border-t border-border/50">
                            <form onSubmit={handleSubmit} className="relative group">
                                <div className="flex items-center gap-2 bg-secondary/40 hover:bg-secondary/60 focus-within:bg-background focus-within:ring-2 focus-within:ring-pink-500/10 focus-within:border-pink-500/30 rounded-[20px] border border-transparent px-4 py-1.5 transition-all duration-300">
                                    {mode === 'admin' && (
                                        <>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleImageUpload}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={isUploading}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="h-8 w-8 rounded-full text-slate-400 hover:text-pink-500 hover:bg-pink-50 shrink-0"
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                                                ) : (
                                                    <ImageIcon className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </>
                                    )}
                                    <input
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={mode === 'ai' ? "Hỏi trợ lý Bông..." : "Nhập lời nhắn..."}
                                        className="flex-1 bg-transparent text-sm py-2.5 focus:outline-none placeholder:text-muted-foreground"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={(mode === 'ai' && isLoading) || !input.trim()}
                                        className="h-9 w-9 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-200/50 border-0 shrink-0 transition-transform active:scale-95"
                                    >
                                        <Send className="h-4 w-4 text-white" />
                                    </Button>
                                </div>
                            </form>
                            <div className="flex items-center justify-center gap-1.5 mt-4">
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.1em]">Bông Cosmetic ✨ {mode === 'ai' ? 'AI Power' : 'Hỗ trợ 24/7'}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatBot;
