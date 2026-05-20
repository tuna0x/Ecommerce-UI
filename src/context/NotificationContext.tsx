import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Notification } from '../types/notification.type';
import { notificationService } from '../service/notificationService';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { toast } from 'sonner';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    deleteNotification: (id: string) => void;
    fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { stompClient, isConnected } = useSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const mapBackendToFrontend = (notif: any): Notification => {
        // Map backend types to frontend types and icons
        const typeMap: Record<string, Notification['type']> = {
            'ORDER': 'order',
            'SYSTEM': 'system',
            'PROMOTION': 'promo',
            'WISHLIST': 'wishlist',
            'order': 'order',
            'system': 'system',
            'promo': 'promo',
            'wishlist': 'wishlist'
        };

        // Determine link based on type
        let link = notif.link;
        if (!link) {
            if (notif.type === 'ORDER') link = '/orders';
            else if (notif.type === 'PROMOTION') link = '/flash-sale';
        }

        return {
            id: String(notif.id),
            title: notif.title,
            message: notif.message,
            type: typeMap[notif.type] || 'system',
            read: notif.isRead || notif.read || false,
            createdAt: new Date(notif.createdAt),
            link: link
        };
    };

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const data = await notificationService.getNotifications(1, 50); // Fetch more for better history
            if (data && data.result) {
                // Deduplicate by ID
                const mappedData: Notification[] = data.result.map(mapBackendToFrontend);
                const uniqueData: Notification[] = Array.from(new Map(mappedData.map((item: Notification) => [item.id, item])).values());
                setNotifications(uniqueData);
                
                // Recalculate unread count from local data to ensure consistency with UI
                const localUnread = uniqueData.filter((n: Notification) => !n.read).length;
                setUnreadCount(localUnread);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchNotifications]);

    useEffect(() => {
        if (isConnected && stompClient && stompClient.connected && user) {
            let subNotifications: any = null;
            let subTopic: any = null;

            // Subscribe to personal queue
            try {
                subNotifications = stompClient.subscribe('/user/queue/notifications', (message) => {
                    const newNotif = JSON.parse(message.body);
                    const mapped = mapBackendToFrontend(newNotif);
                    
                    setNotifications(prev => [mapped, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    
                    toast(mapped.title, {
                        description: mapped.message,
                        duration: 5000,
                        action: mapped.link ? {
                            label: 'Xem ngay',
                            onClick: () => window.location.href = mapped.link!
                        } : undefined
                    });
                });
            } catch (e) {
                console.error("Failed to subscribe to personal notifications", e);
            }

            // Subscribe to common topic
            try {
                subTopic = stompClient.subscribe('/topic/notifications', (message) => {
                    // Backend sends raw string or simple object for topics
                    let title = 'Thông báo hệ thống';
                    let body = message.body;
                    try {
                        const parsed = JSON.parse(message.body);
                        title = parsed.title || title;
                        body = parsed.message || body;
                    } catch (e) { /* use raw body */ }

                    toast.info(title, { description: body });
                    fetchNotifications(); // Refresh list for global notifications
                });
            } catch (e) {
                console.error("Failed to subscribe to global topic notifications", e);
            }

            return () => {
                try {
                    if (stompClient && stompClient.connected) {
                        if (subNotifications) subNotifications.unsubscribe();
                        if (subTopic) subTopic.unsubscribe();
                    }
                } catch (e) {
                    console.warn("Failed to unsubscribe in NotificationContext", e);
                }
            };
        }
    }, [isConnected, stompClient, user, fetchNotifications]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            // Find current status before update
            const notif = notifications.find(n => n.id === id);
            
            await notificationService.markAsRead(id);
            
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            
            // Only decrement count if it was unread
            if (notif && !notif.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    }, [notifications]);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    const deleteNotification = useCallback((id: string) => {
        setNotifications(prev => {
            const notif = prev.find(n => n.id === id);
            if (notif && !notif.read) {
                setUnreadCount(c => Math.max(0, c - 1));
            }
            return prev.filter(n => n.id !== id);
        });
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            clearAll,
            deleteNotification,
            fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
};
