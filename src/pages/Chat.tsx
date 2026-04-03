import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import ChatBubble from '../components/chat/ChatBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import ChatInput from '../components/chat/ChatInput';
import { adminUser, mockChatMessages } from '../data/mockChats';
import TopBar from '../components/TopBar';
import Header from '../components/Header';
import MobileNavBar from '../components/MobileNavBar';

const Chat: React.FC = () => {
    const navigate = useNavigate();
    const currentUserId = 'user-001';
    const convId = 'conv-001';
    const [messages, setMessages] = useState(mockChatMessages[convId] || []);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = (content: string) => {
        const newMsg = {
            id: `m-${Date.now()}`,
            senderId: currentUserId,
            receiverId: 'admin-001',
            content,
            type: 'text' as const,
            timestamp: new Date().toISOString(),
            isRead: false,
        };
        setMessages((prev) => [...prev, newMsg]);

        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: `m-${Date.now() + 1}`,
                    senderId: 'admin-001',
                    receiverId: currentUserId,
                    content: 'Cảm ơn bạn đã nhắn tin! Mình sẽ kiểm tra và phản hồi ngay nhé 💕',
                    type: 'text' as const,
                    timestamp: new Date().toISOString(),
                    isRead: true,
                },
            ]);
        }, 2000);
    };

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            <div className="hidden md:block">
                <TopBar />
                <Header />
            </div>

            <div className="flex-1 min-h-0 max-w-3xl mx-auto w-full flex flex-col border-x border-border bg-gradient-to-b from-pink-50/50 to-background">
                {/* Chat header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-white">BC</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{adminUser.name}</p>
                            <div className="flex items-center gap-1.5">
                                <span className={cn(
                                    'h-2 w-2 rounded-full',
                                    adminUser.isOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground'
                                )} />
                                <span className="text-xs text-muted-foreground">
                                    {adminUser.isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:text-primary/80 hover:bg-primary/10">
                            <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:text-primary/80 hover:bg-primary/10">
                            <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-accent">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => navigate('/')}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 bg-gradient-to-b from-pink-50/40 to-background">
                    <div className="text-center mb-6">
                        <span className="text-xs text-muted-foreground bg-card px-3 py-1 rounded-full border border-border shadow-sm">
                            Hôm nay
                        </span>
                    </div>
                    {messages.map((msg, i) => {
                        const isOwn = msg.senderId === currentUserId;
                        const showAvatar = i === 0 || messages[i - 1]?.senderId !== msg.senderId;
                        return (
                            <ChatBubble
                                key={msg.id}
                                content={msg.content}
                                isOwn={isOwn}
                                timestamp={msg.timestamp}
                                isRead={msg.isRead}
                                showAvatar={showAvatar}
                                avatarFallback={isOwn ? 'U' : 'BC'}
                            />
                        );
                    })}
                    {isTyping && <TypingIndicator />}
                </div>

                {/* Input */}
                <div className="shrink-0">
                    <ChatInput onSend={handleSend} placeholder="Nhắn tin với Bong Cosmetic..." />
                </div>
            </div>

            <MobileNavBar />
        </div>
    );
};

export default Chat;
