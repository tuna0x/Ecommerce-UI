import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    setActivePartner: (email: string | null) => void;
    sendMessage: (content: string) => void;
    fetchConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { stompClient, isConnected } = useSocket();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
    const [activePartner, setActivePartner] = useState<String | null>(null);

    const fetchConversations = useCallback(async () => {
        if (!user) return;
        try {
            const data = await getConversations();
            if (data && data.result) {
                const mapped: Conversation[] = data.result.map((m: any) => {
                    const partner = m.senderEmail === user.email ? m.receiverEmail : m.senderEmail;
                    return {
                        partnerEmail: partner,
                        lastMessage: m.content,
                        lastMessageTime: m.timestamp,
                        unreadCount: 0 // Will implement unread count later if needed
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
            const data = await getChatHistory(partner);
            if (data && data.result) {
                // Reverse to show oldest first in UI
                setActiveMessages(data.result.reverse());
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    }, []);

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
            fetchHistory(activePartner as string);
        } else {
            setActiveMessages([]);
        }
    }, [activePartner, fetchHistory]);

    useEffect(() => {
        if (isConnected && stompClient && user) {
            const sub = stompClient.subscribe(`/user/${user.email}/queue/messages`, (message) => {
                const newMsg: ChatMessage = JSON.parse(message.body);
                
                // If message belongs to active conversation, add to list
                const partnerOfNewMsg = newMsg.senderEmail === user.email ? newMsg.receiverEmail : newMsg.senderEmail;
                
                if (activePartner === partnerOfNewMsg) {
                    setActiveMessages(prev => [...prev, newMsg]);
                }

                // Update conversation list
                setConversations(prev => {
                    const existing = prev.find(c => c.partnerEmail === partnerOfNewMsg);
                    const updatedConv: Conversation = {
                        partnerEmail: partnerOfNewMsg,
                        lastMessage: newMsg.content,
                        lastMessageTime: newMsg.timestamp,
                        unreadCount: (existing && activePartner !== partnerOfNewMsg) ? existing.unreadCount + 1 : 0
                    };

                    if (existing) {
                        return [updatedConv, ...prev.filter(c => c.partnerEmail !== partnerOfNewMsg)];
                    } else {
                        return [updatedConv, ...prev];
                    }
                });
            });

            return () => sub.unsubscribe();
        }
    }, [isConnected, stompClient, user, activePartner]);

    const sendMessage = (content: string) => {
        if (!stompClient || !isConnected || !user || !activePartner) return;

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
            activePartner: activePartner as string,
            setActivePartner: (email) => setActivePartner(email),
            sendMessage,
            fetchConversations
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
