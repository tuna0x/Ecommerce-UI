import React, { useState, useRef, useEffect } from 'react';
import { Search, Circle, Send, Image as ImageIcon, MoreVertical, MessageSquare } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const ChatManagement: React.FC = () => {
  const { user } = useAuth();
  const { 
    conversations, 
    activeMessages, 
    activePartner, 
    setActivePartner, 
    sendMessage 
  } = useChat();
  
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = conversations.filter((c) =>
    c.partnerEmail.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages, activePartner]);

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

  const getActiveConv = conversations.find(c => c.partnerEmail === activePartner);

  return (
    <div className="h-[calc(100vh-theme(spacing.6)*2)] flex rounded-xl border border-border overflow-hidden bg-card shadow-sm">
      {/* Left panel – conversation list */}
      <div className="w-80 border-r border-border flex flex-col bg-white shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold mb-3">Tin nhắn</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm khách hàng..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-pink-50/60 rounded-lg border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => (
            <button
              key={conv.partnerEmail}
              onClick={() => setActivePartner(conv.partnerEmail)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-pink-50/60 transition-colors border-b border-border/50',
                activePartner === conv.partnerEmail && 'bg-pink-50 border-l-2 border-l-pink-500'
              )}
            >
              <div className="relative shrink-0">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {conv.partnerEmail.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Status indicator can be added here if needed */}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className={cn('text-sm truncate', conv.unreadCount > 0 ? 'font-bold' : 'font-medium')}>
                    {conv.partnerEmail}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatTime(conv.lastMessageTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className={cn('text-xs truncate', conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <Badge className="h-5 min-w-[20px] rounded-full bg-pink-500 text-white text-[10px] px-1.5 shrink-0">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
                Chưa có hội thoại nào
            </div>
          )}
        </div>
      </div>

      {/* Right panel – chat window */}
      {activePartner ? (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-pink-50/30 to-white">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white/90">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{activePartner.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-semibold">{activePartner}</p>
                <div className="flex items-center gap-1.5">
                  <Circle className={cn('h-2 w-2 fill-current', 'text-green-500')} />
                  <span className="text-xs text-muted-foreground">
                    Trực tuyến
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
            {activeMessages.map((msg, i) => {
              const isMine = msg.senderEmail === user?.email;
              const showAvatar = !isMine && (i === 0 || activeMessages[i - 1]?.senderEmail !== msg.senderEmail);
              return (
                <div
                  key={i}
                  className={cn('flex gap-2', isMine ? 'justify-end' : 'justify-start')}
                >
                  {!isMine && showAvatar && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center shrink-0 mt-auto">
                      <span className="text-xs font-semibold text-white">{msg.senderEmail.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {!isMine && !showAvatar && <div className="w-8 shrink-0" />}
                  <div className={cn(
                    'max-w-[65%] px-4 py-2.5 text-sm shadow-sm',
                    isMine
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl rounded-br-md'
                      : 'bg-white border border-pink-100 text-foreground rounded-2xl rounded-bl-md'
                  )}>
                    {msg.content}
                    <div className={cn('text-[10px] mt-1', isMine ? 'text-white/70 text-right' : 'text-muted-foreground')}>
                      {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 px-4 py-3 border-t border-border bg-white"
          >
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-pink-500">
              <ImageIcon className="h-5 w-5" />
            </Button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-pink-50/60 rounded-full px-4 py-2.5 text-sm border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300/50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-40"
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-pink-300" />
            </div>
            <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatManagement;
