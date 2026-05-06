import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { getChatHistory, getConversations } from '../service/chatService';

export interface ChatMessage {
    senderEmail: string;
    receiverEmail: string;
    content: string;
    timestamp: string;
}

export interface Conversation {
    partnerEmail: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

interface ChatContextType {
    conversations: Conversation[];
    activeMessages: ChatMessage[];
    activePartner: string | null;
    totalUnreadCount: number;
    setActivePartner: (email: string | null) => void;
    sendMessage: (content: string) => void;
    fetchConversations: () => Promise<void>;
    resetUnreadCount: (email: string) => void;
    loadMoreHistory: () => Promise<void>;
    hasMoreHistory: boolean;
    isLoadingHistory: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { stompClient, isConnected } = useSocket();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
    const [activePartner, setActivePartner] = useState<string | null>(null);
    const activePartnerRef = useRef<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Sync ref with state
    useEffect(() => {
        activePartnerRef.current = activePartner;
    }, [activePartner]);

    const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    const resetUnreadCount = useCallback((partner: string) => {
        setConversations(prev => prev.map(c => 
            c.partnerEmail === partner ? { ...c, unreadCount: 0 } : c
        ));
    }, []);

    const fetchConversations = useCallback(async () => {
        if (!user) return;
        try {
            const res = await getConversations(); // res is RestResponse
            if (res && res.data) {
                const mapped: Conversation[] = res.data.map((m: any) => {
                    const partner = m.senderEmail === user.email ? m.receiverEmail : m.senderEmail;
                    return {
                        partnerEmail: partner,
                        lastMessage: m.content,
                        lastMessageTime: m.timestamp,
                        unreadCount: 0 
                    };
                });
                setConversations(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch conversations", err);
        }
    }, [user]);

    const fetchHistory = useCallback(async (partner: string) => {
        try {
            setIsLoadingHistory(true);
            const res = await getChatHistory(partner, 0); // res is RestResponse
            if (res && res.data) {
                setActiveMessages(res.data.reverse());
                setCurrentPage(0);
                setHasMoreHistory(res.data.length === 20); // API uses limit 20
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    const loadMoreHistory = useCallback(async () => {
        if (!activePartner || !hasMoreHistory || isLoadingHistory) return;
        try {
            setIsLoadingHistory(true);
            const nextPage = currentPage + 1;
            const res = await getChatHistory(activePartner, nextPage);
            if (res && res.data) {
                const olderMessages = res.data.reverse();
                setActiveMessages(prev => [...olderMessages, ...prev]);
                setCurrentPage(nextPage);
                setHasMoreHistory(res.data.length === 20);
            }
        } catch (err) {
            console.error("Failed to load more history", err);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [activePartner, currentPage, hasMoreHistory, isLoadingHistory]);

    useEffect(() => {
        if (user) {
            fetchConversations();
        } else {
            setConversations([]);
            setActiveMessages([]);
            setActivePartner(null);
        }
    }, [user, fetchConversations]);

    useEffect(() => {
        if (activePartner) {
            fetchHistory(activePartner);
            resetUnreadCount(activePartner);
        } else {
            setActiveMessages([]);
        }
    }, [activePartner, fetchHistory, resetUnreadCount]);

    useEffect(() => {
        if (isConnected && stompClient && stompClient.connected && user) {
            let sub: any = null;
            try {
                sub = stompClient.subscribe("/user/queue/messages", (message) => {
                    const newMsg: ChatMessage = JSON.parse(message.body);
                    
                    const partnerOfNewMsg = newMsg.senderEmail === user.email ? newMsg.receiverEmail : newMsg.senderEmail;
                    const currentActive = activePartnerRef.current;
                    
                    // Fallback for missing/invalid timestamp from server
                    if (!newMsg.timestamp || new Date(newMsg.timestamp).getFullYear() < 2000) {
                        newMsg.timestamp = new Date().toISOString();
                    }

                    if (currentActive === partnerOfNewMsg) {
                        setActiveMessages(prev => {
                            // Improved duplicate detection: 
                            // If content and sender match, and timestamps are either close OR one is very old (faulty echo)
                            const isDuplicate = prev.some(m => 
                                m.content === newMsg.content && 
                                m.senderEmail === newMsg.senderEmail &&
                                (
                                    Math.abs(new Date(m.timestamp).getTime() - new Date(newMsg.timestamp).getTime()) < 5000 ||
                                    new Date(m.timestamp).getFullYear() < 2000 || 
                                    new Date(newMsg.timestamp).getFullYear() < 2000
                                )
                            );
                            return isDuplicate ? prev : [...prev, newMsg];
                        });
                    }

                    setConversations(prev => {
                        const existing = prev.find(c => c.partnerEmail === partnerOfNewMsg);
                        const isFocusing = currentActive === partnerOfNewMsg;
                        const isFromPartner = newMsg.senderEmail === partnerOfNewMsg;

                        const updatedConv: Conversation = {
                            partnerEmail: partnerOfNewMsg,
                            lastMessage: newMsg.content,
                            lastMessageTime: newMsg.timestamp,
                            unreadCount: (isFromPartner && !isFocusing) 
                                ? (existing ? existing.unreadCount + 1 : 1) 
                                : 0
                        };

                        const filtered = prev.filter(c => c.partnerEmail !== partnerOfNewMsg);
                        return [updatedConv, ...filtered];
                    });
                });
            } catch (e) {
                console.error("Failed to subscribe in ChatContext", e);
            }

            return () => {
                if (sub) {
                    try {
                        if (stompClient && stompClient.connected) {
                            sub.unsubscribe();
                        }
                    } catch (e) {
                        console.warn("Failed to unsubscribe in ChatContext", e);
                    }
                }
            };
        }
    }, [isConnected, stompClient, user]);

    const sendMessage = (content: string) => {
        if (!stompClient || !isConnected || !user || !activePartner) return;
        
        const timestamp = new Date().toISOString();
        const optimisticMsg: ChatMessage = {
            senderEmail: user.email,
            receiverEmail: activePartner,
            content: content,
            timestamp: timestamp
        };

        // Optimistic UI updates
        setActiveMessages(prev => [...prev, optimisticMsg]);
        setConversations(prev => {
            const filtered = prev.filter(c => c.partnerEmail !== activePartner);
            return [{
                partnerEmail: activePartner,
                lastMessage: content,
                lastMessageTime: timestamp,
                unreadCount: 0
            }, ...filtered];
        });

        const chatMessageDTO = {
            receiverEmail: activePartner,
            content: content
        };

        stompClient.publish({
            destination: '/app/chat.send',
            body: JSON.stringify(chatMessageDTO)
        });
    };

    return (
        <ChatContext.Provider value={{
            conversations,
            activeMessages,
            activePartner,
            totalUnreadCount,
            setActivePartner,
            sendMessage,
            fetchConversations,
            resetUnreadCount,
            loadMoreHistory,
            hasMoreHistory,
            isLoadingHistory
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within ChatProvider');
    return context;
};
