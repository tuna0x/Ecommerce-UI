export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'order' | 'promo' | 'system' | 'wishlist';
    read: boolean;
    createdAt: Date;
    link?: string;
}
