import axiosInstance from './axiosInstance';
import type { Notification } from '../types/notification.type';

interface Meta {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
}

interface NotificationResponse {
    meta: Meta;
    result: any[];
}

export const notificationService = {
    getNotifications: async (page: number = 1, pageSize: number = 10) => {
        const response = await axiosInstance.get<any>('/notifications', {
            params: { page: page - 1, size: pageSize }
        });
        return response.data?.data; // Extract data from RestResponse
    },

    markAsRead: async (id: string | number) => {
        const response = await axiosInstance.put<any>(`/notifications/${id}/read`);
        return response.data?.data;
    },

    markAllAsRead: async () => {
        const response = await axiosInstance.put<any>('/notifications/read-all');
        return response.data?.data;
    },

    getUnreadCount: async () => {
        const response = await axiosInstance.get<any>('/notifications/unread-count');
        return response.data?.data; // Return just the number
    }
};
