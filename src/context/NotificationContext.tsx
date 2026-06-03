import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { IMessage, StompSubscription } from '@stomp/stompjs';
import type { BackendNotification, Notification } from '../types/notification.type';
import type { IMeta } from '../types/api.type';
import { notificationService } from '../service/notificationService';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { toast } from 'sonner';

interface NotificationContextType {
    notifications: Notification[];
    notificationMeta: IMeta;
    isLoadingNotifications: boolean;
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    deleteNotification: (id: string) => void;
    fetchNotifications: (page?: number, pageSize?: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { stompClient, isConnected } = useSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationMeta, setNotificationMeta] = useState<IMeta>({
        page: 1,
        pageSize: 10,
        pages: 1,
        total: 0,
    });
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const mapBackendToFrontend = (notif: BackendNotification): Notification => {
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

    const fetchNotifications = useCallback(async (page: number = 1, pageSize: number = 10) => {
        if (!user) return;
        setIsLoadingNotifications(true);
        try {
            const [data, unread] = await Promise.all([
                notificationService.getNotifications(page, pageSize),
                notificationService.getUnreadCount(),
            ]);
            if (data && data.result) {
                // Deduplicate by ID
                const mappedData: Notification[] = data.result.map(mapBackendToFrontend);
                const uniqueData: Notification[] = Array.from(new Map(mappedData.map((item: Notification) => [item.id, item])).values());
                setNotifications(uniqueData);
                setNotificationMeta(data.meta || {
                    page,
                    pageSize,
                    pages: 1,
                    total: uniqueData.length,
                });
            }
            setUnreadCount(Number(unread || 0));
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setIsLoadingNotifications(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setNotificationMeta({
                page: 1,
                pageSize: 10,
                pages: 1,
                total: 0,
            });
            setUnreadCount(0);
        }
    }, [user, fetchNotifications]);

    useEffect(() => {
        if (isConnected && stompClient && stompClient.connected && user) {
            let subNotifications: StompSubscription | null = null;
            let subTopic: StompSubscription | null = null;

            // Subscribe to personal queue
            try {
                subNotifications = stompClient.subscribe('/user/queue/notifications', (message: IMessage) => {
                    const newNotif = JSON.parse(message.body) as BackendNotification;
                    const mapped = mapBackendToFrontend(newNotif);
                    
                    setNotifications(prev => [mapped, ...prev].slice(0, notificationMeta.pageSize));
                    setNotificationMeta(prev => ({ ...prev, total: prev.total + 1 }));
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
                subTopic = stompClient.subscribe('/topic/notifications', (message: IMessage) => {
                    // Backend sends raw string or simple object for topics
                    let title = 'Thông báo hệ thống';
                    let body = message.body;
                    try {
                        const parsed = JSON.parse(message.body);
                        title = parsed.title || title;
                        body = parsed.message || body;
                    } catch { /* use raw body */ }

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
    }, [isConnected, stompClient, user, fetchNotifications, notificationMeta.pageSize]);

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
        setNotificationMeta(prev => ({ ...prev, total: 0, pages: 1, page: 1 }));
        setUnreadCount(0);
    }, []);

    const deleteNotification = useCallback((id: string) => {
        setNotifications(prev => {
            const notif = prev.find(n => n.id === id);
            if (notif && !notif.read) {
                setUnreadCount(c => Math.max(0, c - 1));
            }
            setNotificationMeta(meta => ({ ...meta, total: Math.max(0, meta.total - 1) }));
            return prev.filter(n => n.id !== id);
        });
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            notificationMeta,
            isLoadingNotifications,
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

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
};
