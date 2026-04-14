import axiosInstance from "./axiosInstance";

export const sendMessage = async (message: string, history: {role: string, content: string}[] = []) => {
    const res = await axiosInstance.post("/chat", { message, history });
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
