import React, { useState, useRef, useEffect } from 'react';
import { Search, Circle, Send, Image as ImageIcon, MoreVertical } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';
import {
  mockConversations,
  mockChatMessages,
  type Conversation,
  type ChatMessage,
} from '../../data/mockChats';

const ChatManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(mockConversations[0]);
  const [conversations] = useState(mockConversations);
  const [messageMap, setMessageMap] = useState(mockChatMessages);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = conversations.filter((c) =>
    c.user.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentMessages = React.useMemo(() => {
    return selectedConv ? messageMap[selectedConv.id] || [] : [];
  }, [messageMap, selectedConv]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages, selectedConv]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedConv) return;
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: 'admin-001',
      receiverId: selectedConv.user.id,
      content: trimmed,
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setMessageMap((prev) => ({
      ...prev,
      [selectedConv.id]: [...(prev[selectedConv.id] || []), newMsg],
    }));
    setInput('');
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`;
    if (diff < 86400000) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

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
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-pink-50/60 transition-colors border-b border-border/50',
                selectedConv?.id === conv.id && 'bg-pink-50 border-l-2 border-l-pink-500'
              )}
            >
              <div className="relative shrink-0">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {conv.user.name.charAt(0)}
                  </span>
                </div>
                {conv.user.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className={cn('text-sm truncate', conv.unreadCount > 0 ? 'font-bold' : 'font-medium')}>
                    {conv.user.name}
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
        </div>
      </div>

      {/* Right panel – chat window */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-pink-50/30 to-white">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white/90">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{selectedConv.user.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold">{selectedConv.user.name}</p>
                <div className="flex items-center gap-1.5">
                  <Circle className={cn('h-2 w-2 fill-current', selectedConv.user.isOnline ? 'text-green-500' : 'text-muted-foreground')} />
                  <span className="text-xs text-muted-foreground">
                    {selectedConv.user.isOnline ? 'Đang hoạt động' : `Hoạt động ${formatTime(selectedConv.user.lastSeen || '')}`}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
            <div className="text-center mb-4">
              <span className="text-xs text-muted-foreground bg-white px-3 py-1 rounded-full border border-pink-100 shadow-sm">
                Bắt đầu cuộc trò chuyện
              </span>
            </div>
            {currentMessages.map((msg, i) => {
              const isAdmin = msg.senderId === 'admin-001';
              const showAvatar = i === 0 || currentMessages[i - 1]?.senderId !== msg.senderId;
              return (
                <div
                  key={msg.id}
                  className={cn('flex gap-2 mb-3', isAdmin ? 'justify-end' : 'justify-start')}
                >
                  {!isAdmin && showAvatar && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center shrink-0 mt-auto">
                      <span className="text-xs font-semibold text-white">{selectedConv.user.name.charAt(0)}</span>
                    </div>
                  )}
                  {!isAdmin && !showAvatar && <div className="w-8 shrink-0" />}
                  <div className={cn(
                    'max-w-[65%] px-4 py-2.5 text-sm shadow-sm',
                    isAdmin
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl rounded-br-md'
                      : 'bg-white border border-pink-100 text-foreground rounded-2xl rounded-bl-md'
                  )}>
                    {msg.content}
                    <div className={cn('text-[10px] mt-1', isAdmin ? 'text-white/70 text-right' : 'text-muted-foreground')}>
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
              <Search className="h-8 w-8 text-pink-300" />
            </div>
            <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatManagement;
