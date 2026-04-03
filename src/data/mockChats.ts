export interface ChatUser {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
    lastSeen?: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    imageUrl?: string;
    timestamp: string;
    isRead: boolean;
}

export interface Conversation {
    id: string;
    user: ChatUser;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

export const adminUser: ChatUser = {
    id: 'admin-001',
    name: 'Bong Cosmetic Support',
    avatar: '',
    isOnline: true,
};

export const mockChatUsers: ChatUser[] = [
    { id: 'user-001', name: 'Nguyễn Thị Mai', avatar: '', isOnline: true },
    { id: 'user-002', name: 'Trần Văn Hùng', avatar: '', isOnline: false, lastSeen: '2026-04-01T08:30:00Z' },
    { id: 'user-003', name: 'Lê Thị Hoa', avatar: '', isOnline: true },
    { id: 'user-004', name: 'Phạm Minh Tuấn', avatar: '', isOnline: false, lastSeen: '2026-03-31T22:15:00Z' },
    { id: 'user-005', name: 'Hoàng Thị Lan', avatar: '', isOnline: true },
    { id: 'user-006', name: 'Đặng Văn Nam', avatar: '', isOnline: false, lastSeen: '2026-04-01T07:00:00Z' },
];

export const mockConversations: Conversation[] = [
    { id: 'conv-001', user: mockChatUsers[0], lastMessage: 'Cho mình hỏi sản phẩm này còn hàng không?', lastMessageTime: '2026-04-01T09:45:00Z', unreadCount: 3 },
    { id: 'conv-002', user: mockChatUsers[1], lastMessage: 'Cảm ơn shop nhé!', lastMessageTime: '2026-04-01T08:30:00Z', unreadCount: 0 },
    { id: 'conv-003', user: mockChatUsers[2], lastMessage: 'Mình muốn đổi size ạ', lastMessageTime: '2026-04-01T09:20:00Z', unreadCount: 1 },
    { id: 'conv-004', user: mockChatUsers[3], lastMessage: 'Khi nào có hàng mới vậy shop?', lastMessageTime: '2026-03-31T22:10:00Z', unreadCount: 0 },
    { id: 'conv-005', user: mockChatUsers[4], lastMessage: 'Tư vấn giúp mình serum cho da dầu', lastMessageTime: '2026-04-01T09:50:00Z', unreadCount: 2 },
    { id: 'conv-006', user: mockChatUsers[5], lastMessage: 'Đơn hàng của mình đến đâu rồi?', lastMessageTime: '2026-04-01T07:00:00Z', unreadCount: 0 },
];

export const mockChatMessages: Record<string, ChatMessage[]> = {
    'conv-001': [
        { id: 'm1', senderId: 'user-001', receiverId: 'admin-001', content: 'Chào shop! 👋', type: 'text', timestamp: '2026-04-01T09:30:00Z', isRead: true },
        { id: 'm2', senderId: 'admin-001', receiverId: 'user-001', content: 'Chào bạn! Bong Cosmetic xin chào, mình có thể giúp gì cho bạn ạ? 💕', type: 'text', timestamp: '2026-04-01T09:31:00Z', isRead: true },
        { id: 'm3', senderId: 'user-001', receiverId: 'admin-001', content: 'Cho mình hỏi serum vitamin C còn hàng không ạ?', type: 'text', timestamp: '2026-04-01T09:35:00Z', isRead: true },
        { id: 'm4', senderId: 'admin-001', receiverId: 'user-001', content: 'Dạ bên mình vẫn còn hàng ạ! Hiện đang có chương trình giảm 20% cho serum vitamin C dòng mới nhé 🎉', type: 'text', timestamp: '2026-04-01T09:36:00Z', isRead: true },
        { id: 'm5', senderId: 'user-001', receiverId: 'admin-001', content: 'Cho mình hỏi sản phẩm này còn hàng không?', type: 'text', timestamp: '2026-04-01T09:45:00Z', isRead: false },
    ],
    'conv-003': [
        { id: 'm6', senderId: 'user-003', receiverId: 'admin-001', content: 'Mình mới đặt đơn hôm qua', type: 'text', timestamp: '2026-04-01T09:10:00Z', isRead: true },
        { id: 'm7', senderId: 'admin-001', receiverId: 'user-003', content: 'Dạ bạn cho mình mã đơn hàng được không ạ?', type: 'text', timestamp: '2026-04-01T09:12:00Z', isRead: true },
        { id: 'm8', senderId: 'user-003', receiverId: 'admin-001', content: 'Mình muốn đổi size ạ', type: 'text', timestamp: '2026-04-01T09:20:00Z', isRead: false },
    ],
    'conv-005': [
        { id: 'm9', senderId: 'user-005', receiverId: 'admin-001', content: 'Shop ơi, da mình bị dầu nhiều lắm 😢', type: 'text', timestamp: '2026-04-01T09:40:00Z', isRead: true },
        { id: 'm10', senderId: 'admin-001', receiverId: 'user-005', content: 'Dạ bạn đang dùng routine skincare như nào ạ? Mình sẽ tư vấn phù hợp nhé!', type: 'text', timestamp: '2026-04-01T09:42:00Z', isRead: true },
        { id: 'm11', senderId: 'user-005', receiverId: 'admin-001', content: 'Tư vấn giúp mình serum cho da dầu', type: 'text', timestamp: '2026-04-01T09:50:00Z', isRead: false },
    ],
};
