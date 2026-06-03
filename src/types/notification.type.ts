export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'order' | 'promo' | 'system' | 'wishlist';
    read: boolean;
    createdAt: Date;
    link?: string;
}

export interface BackendNotification {
    id: string | number;
    title: string;
    message: string;
    type: string;
    isRead?: boolean;
    read?: boolean;
    createdAt: string | number | Date;
    link?: string;
}
