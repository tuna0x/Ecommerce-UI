import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'order' | 'promo' | 'system' | 'wishlist';
    read: boolean;
    createdAt: Date;
    link?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    deleteNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const defaultNotifications: Notification[] = [
    {
        id: '1',
        title: '🔥 Flash Sale đang diễn ra!',
        message: 'Giảm đến 50% cho hàng trăm sản phẩm. Nhanh tay kẻo hết!',
        type: 'promo',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        link: '/flash-sale',
    },
    {
        id: '2',
        title: 'Đơn hàng #1234 đã được giao',
        message: 'Đơn hàng của bạn đã được giao thành công. Hãy đánh giá sản phẩm nhé!',
        type: 'order',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        link: '/orders',
    },
    {
        id: '3',
        title: 'Sản phẩm yêu thích giảm giá',
        message: 'Serum Vitamin C 15% bạn yêu thích đang giảm 29%!',
        type: 'wishlist',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        link: '/product/1',
    },
    {
        id: '4',
        title: 'Chào mừng bạn đến BeautyLux!',
        message: 'Nhập mã WELCOME10 để giảm 10% cho đơn hàng đầu tiên.',
        type: 'system',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = useCallback((notif: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
        const newNotif: Notification = {
            ...notif,
            id: Date.now().toString(),
            read: false,
            createdAt: new Date(),
        };
        setNotifications(prev => [newNotif, ...prev]);
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const deleteNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll, deleteNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
};
