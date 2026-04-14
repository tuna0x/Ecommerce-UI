import axiosInstance from "./axiosInstance";

export const logActivity = async (actionType: string, metadata: object = {}) => {
    try {
        await axiosInstance.post("/tracking/log", {
            actionType,
            metadata: JSON.stringify(metadata)
        });
    } catch (error) {
        // Silently fail so we don't break the user experience
        console.error("Tracking error:", error);
    }
};
export const getAllLogs = (page: number, size: number, filter?: string, sort: string = 'createdAt,desc') => {
    let url = `/tracking/logs?page=${page}&size=${size}&sort=${sort}`;
    if (filter) {
        url += `&filter=${encodeURIComponent(filter)}`;
    }
    return axiosInstance.get(url);
};
