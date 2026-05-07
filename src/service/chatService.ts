import axiosInstance from "./axiosInstance";
import { getSessionId, getDeviceType } from "./trackingService";

export const sendMessage = async (message: string, history: {role: string, content: string}[] = []) => {
    const res = await axiosInstance.post("/chat", { 
        message, 
        history,
        sessionId: getSessionId(),
        deviceType: getDeviceType(),
        pageUrl: window.location.pathname
    });
    return res.data;
};

export const getChatHistory = async (participant: string, page: number = 0) => {
    const res = await axiosInstance.get(`/chat/history?participant=${participant}&page=${page}&size=20`);
    return res.data;
};

export const getConversations = async () => {
    const res = await axiosInstance.get('/chat/conversations');
    return res.data;
};

export const markMessagesAsRead = async (participant: string) => {
    const res = await axiosInstance.post(`/chat/read?participant=${participant}`);
    return res.data;
};
