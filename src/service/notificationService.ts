import axiosInstance from './axiosInstance';

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
