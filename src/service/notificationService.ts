import axiosInstance from './axiosInstance';
import type { IApiResponse, IPagination } from '../types/api.type';
import type { BackendNotification, Notification } from '../types/notification.type';

export const notificationService = {
    getNotifications: async (page: number = 1, pageSize: number = 10) => {
        const response = await axiosInstance.get<IApiResponse<IPagination<BackendNotification>>>('/notifications', {
            params: { page: page - 1, size: pageSize }
        });
        return response.data?.data as IPagination<BackendNotification>; // Extract data from RestResponse
    },

    markAsRead: async (id: string | number) => {
        const response = await axiosInstance.put<IApiResponse<Notification>>(`/notifications/${id}/read`);
        return response.data?.data;
    },

    markAllAsRead: async () => {
        const response = await axiosInstance.put<IApiResponse<unknown>>('/notifications/read-all');
        return response.data?.data;
    },

    getUnreadCount: async () => {
        const response = await axiosInstance.get<IApiResponse<number>>('/notifications/unread-count');
        return response.data?.data; // Return just the number
    }
};
