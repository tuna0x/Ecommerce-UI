import React, { useState, useRef, useEffect } from 'react';
import { Search, Send, Image as ImageIcon, MoreVertical, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { uploadChatImage } from '../../service/chatService';

const isImageUrl = (url: string) => {
    if (typeof url !== 'string') return false;
    return (
        url.startsWith('http://') || url.startsWith('https://')
    ) && (
        url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) !== null || 
        url.includes('res.cloudinary.com')
    );
};

const QUICK_REPLIES = [
    { label: "👋 Chào khách", text: "Xin chào bạn! Bông Cosmetic có thể giúp gì cho bạn hôm nay ạ? 🌸" },
    { label: "🧴 Tư vấn da", text: "Để bên mình tư vấn chuẩn nhất cho bạn, bạn có thể cho mình biết da bạn đang thuộc dòng da nào (da dầu, da khô hay da nhạy cảm) ạ? ✨" },
    { label: "🏷️ Mã ưu đãi", text: "Bông Cosmetic thân gửi bạn mã [BONGNEW] để giảm giá 10% cho đơn hàng đầu tiên của bạn nha! 💝" },
    { label: "📦 Phí vận chuyển", text: "Dạ, bên mình miễn phí giao hàng cho mọi đơn hàng từ 500k trở lên trên toàn quốc nha! 🚚" },
    { label: "💖 Cảm ơn", text: "Cảm ơn bạn đã tin dùng và lựa chọn Bông Cosmetic! Chúc bạn có một ngày rực rỡ và xinh đẹp! ✨" },
];

const ChatManagement: React.FC = () => {
    const { user } = useAuth();
    const { 
        conversations, 
        activeMessages, 
        activePartner, 
        setActivePartner, 
        sendMessage,
        resetUnreadCount,
        loadMoreHistory,
        hasMoreHistory,
        isLoadingHistory
    } = useChat();
    
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activePartner) return;
        setIsUploading(true);
        try {
            const res = await uploadChatImage(file);
            if (res && res.url) {
                sendMessage(res.url);
            }
        } catch (err) {
            console.error("Lỗi upload ảnh", err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const prevScrollHeightRef = useRef<number | null>(null);

    const filtered = conversations.filter((c) => {
        const matchesSearch = c.partnerEmail.toLowerCase().includes(search.toLowerCase());
        if (filter === 'unread') {
            return matchesSearch && c.unreadCount > 0;
        }
        return matchesSearch;
    });

    const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollTop <= 15 && hasMoreHistory && !isLoadingHistory) {
            prevScrollHeightRef.current = target.scrollHeight;
            await loadMoreHistory();
        }
    };

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            if (prevScrollHeightRef.current !== null) {
                const heightDiff = scrollRef.current.scrollHeight - prevScrollHeightRef.current;
                scrollRef.current.scrollTop = heightDiff;
                prevScrollHeightRef.current = null;
            } else {
                scrollRef.current.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeMessages]);

    const handleSelectPartner = (email: string) => {
        setActivePartner(email);
        resetUnreadCount(email);
    };

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || !activePartner) return;
        sendMessage(trimmed);
        setInput('');
    };

    const formatTime = (ts: string) => {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 60000) return 'Vừa xong';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`;
        if (diff < 86400000) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] flex bg-white shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden border border-border/40">
            {/* Sidebar: Conversation List */}
            <div className={cn(
                "w-full md:w-[320px] flex-col border-r border-border/40 bg-slate-50/30",
                activePartner ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 md:p-5 space-y-3 shrink-0 border-b border-slate-100">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">Tin nhắn</h2>
                        {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                            <div className="flex items-center justify-center h-5 w-5 md:h-6 md:w-6 rounded-full bg-pink-500 text-[10px] font-bold text-white shadow-lg shadow-pink-200 animate-pulse">
                                {conversations.filter(c => c.unreadCount > 0).length}
                            </div>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                        <button
                            onClick={() => setFilter('all')}
                            className={cn(
                                "flex-1 py-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-all",
                                filter === 'all' 
                                    ? "bg-white text-slate-800 shadow-sm" 
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={cn(
                                "flex-1 py-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                                filter === 'unread' 
                                    ? "bg-pink-500 text-white shadow-sm shadow-pink-200" 
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Chưa đọc
                            {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                                <span className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    filter === 'unread' ? "bg-white animate-pulse" : "bg-pink-500 animate-pulse"
                                )} />
                            )}
                        </button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm khách hàng..."
                            className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl md:rounded-2xl border border-transparent shadow-sm focus:border-pink-200 focus:ring-4 focus:ring-pink-500/5 transition-all outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 md:px-3 pb-4 space-y-1 custom-scrollbar">
                    {filtered.map((conv) => (
                        <button
                            key={conv.partnerEmail}
                            onClick={() => handleSelectPartner(conv.partnerEmail)}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-3 rounded-xl md:rounded-2xl transition-all duration-300 relative group',
                                activePartner === conv.partnerEmail 
                                    ? 'bg-white shadow-md shadow-slate-200/50 md:scale-[1.02]' 
                                    : 'hover:bg-slate-200/50'
                            )}
                        >
                            <div className="relative shrink-0">
                                <div className={cn(
                                    "h-10 w-10 md:h-11 md:w-11 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm font-bold text-sm",
                                    activePartner === conv.partnerEmail 
                                        ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white" 
                                        : "bg-white text-slate-500 border border-slate-100"
                                )}>
                                    {conv.partnerEmail.charAt(0).toUpperCase()}
                                </div>
                                <span className={cn(
                                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                                    "bg-emerald-500"
                                )} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <p className={cn(
                                        'text-[13px] truncate font-bold',
                                        activePartner === conv.partnerEmail ? 'text-slate-900' : 'text-slate-700'
                                    )}>
                                        {conv.partnerEmail.split('@')[0]}
                                    </p>
                                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                        {formatTime(conv.lastMessageTime)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <p className={cn(
                                        'text-[11px] md:text-xs truncate flex-1',
                                        conv.unreadCount > 0 ? 'text-pink-600 font-bold' : 'text-slate-500'
                                    )}>
                                        {conv.lastMessage}
                                    </p>
                                    {conv.unreadCount > 0 && (
                                        <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse shrink-0" />
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <div className="py-10 text-center px-4">
                            <p className="text-xs text-slate-400 italic">Không tìm thấy hội thoại nào</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-white transition-opacity duration-300",
                !activePartner ? "hidden md:flex" : "flex"
            )}>
                {activePartner ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md z-10">
                            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="md:hidden h-8 w-8 shrink-0"
                                    onClick={() => setActivePartner(null)}
                                >
                                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                                </Button>
                                <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                    <span className="text-sm font-bold text-slate-600">{activePartner.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="truncate">
                                    <h3 className="text-[13px] md:text-sm font-bold text-slate-800 truncate">{activePartner}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trực tuyến</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-xl hover:bg-slate-100">
                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                </Button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div 
                            ref={scrollRef} 
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50 custom-scrollbar"
                        >
                            {isLoadingHistory && (
                                <div className="flex justify-center py-2">
                                    <span className="text-[10px] text-slate-400 font-bold loading-dots">Đang tải tin nhắn cũ...</span>
                                </div>
                            )}

                            {!hasMoreHistory && activeMessages.length > 0 && (
                                <div className="flex flex-col items-center justify-center py-6 border-b border-dashed border-slate-200/60 mb-4 text-center">
                                    <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-2 shadow-sm shadow-slate-100">
                                        <MessageSquare className="h-5 w-5 text-pink-500 animate-pulse" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-700">Khởi đầu cuộc trò chuyện ✨</p>
                                    <p className="text-[10px] text-slate-400 mt-1 max-w-[220px] leading-relaxed font-medium">Đây là bắt đầu lịch sử trò chuyện giữa bạn và khách hàng.</p>
                                </div>
                            )}

                            {activeMessages.map((msg, i) => {
                                const isMine = msg.senderEmail === user?.email;
                                const msgDate = new Date(msg.timestamp);
                                const isValidDateMsg = msgDate.getFullYear() >= 2000;
                                
                                const showDate = isValidDateMsg && (i === 0 || 
                                    new Date(activeMessages[i-1].timestamp).toDateString() !== msgDate.toDateString()
                                );
                                
                                return (
                                    <React.Fragment key={i}>
                                        {showDate && (
                                            <div className="flex justify-center py-4">
                                                <div className="px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {new Date(msg.timestamp).toLocaleDateString('vi-VN', { 
                                                            weekday: 'short', 
                                                            day: 'numeric', 
                                                            month: 'short' 
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <div className={cn(
                                            'flex flex-col',
                                            isMine ? 'ml-auto items-end max-w-[85%] md:max-w-[75%]' : 'mr-auto items-start max-w-[85%] md:max-w-[75%]'
                                        )}>
                                            <div className={cn(
                                                'px-3.5 py-2 md:px-4 md:py-2.5 text-[13px] md:text-sm shadow-sm transition-all relative',
                                                isMine
                                                    ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-2xl rounded-tr-sm'
                                                    : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm',
                                                isImageUrl(msg.content) && 'p-1.5 bg-white border border-slate-100'
                                            )}>
                                                {isImageUrl(msg.content) ? (
                                                    <img 
                                                        src={msg.content} 
                                                        alt="Chat Attachment" 
                                                        className="max-w-full max-h-[220px] object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                                                        onClick={() => window.open(msg.content, '_blank')}
                                                    />
                                                ) : (
                                                    <p className="leading-relaxed">{msg.content}</p>
                                                )}
                                            </div>
                                            <span className="text-[9px] mt-1 font-bold text-slate-400 px-1">
                                                {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 md:p-5 bg-white border-t border-slate-100 space-y-3">
                            {/* Quick Replies */}
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
                                {QUICK_REPLIES.map((reply, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setInput(reply.text)}
                                        className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-pink-50 hover:text-pink-600 border border-slate-200 hover:border-pink-200 rounded-full text-[10px] font-bold text-slate-600 transition-all active:scale-95 shadow-sm"
                                    >
                                        {reply.label}
                                    </button>
                                ))}
                            </div>

                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex items-center gap-2 md:gap-3 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl p-1 md:p-1.5 focus-within:bg-white focus-within:ring-4 focus-within:ring-pink-500/5 focus-within:border-pink-200 transition-all duration-300"
                            >
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
                                    className="h-8 w-8 md:h-9 md:w-9 text-slate-400 hover:text-pink-500 hover:bg-pink-50 rounded-xl shrink-0"
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                                    ) : (
                                        <ImageIcon className="h-4 w-4" />
                                    )}
                                </Button>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Viết phản hồi..."
                                    className="flex-1 bg-transparent text-xs py-2 outline-none placeholder:text-slate-400 font-medium"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={!input.trim()}
                                    className="h-8 md:h-9 px-3 md:px-4 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-md shadow-pink-200/50 border-0 active:scale-95 disabled:opacity-30 flex items-center gap-2"
                                >
                                    <span className="text-[11px] md:text-xs font-bold text-white hidden xs:inline">Gửi</span>
                                    <Send className="h-3 w-3 text-white" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 bg-slate-50/20">
                        <div className="h-20 w-20 rounded-[2rem] bg-white border border-slate-200 shadow-xl flex items-center justify-center mb-8 rotate-3">
                            <MessageSquare className="h-10 w-10 text-pink-500" />
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-800 mb-2">Trung tâm Chăm sóc</h3>
                        <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed font-medium">
                            Vui lòng chọn một khách hàng để bắt đầu tư vấn.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatManagement;
