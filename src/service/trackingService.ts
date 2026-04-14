import axiosInstance from "./axiosInstance";

// === Session & Device Utilities ===

export const getSessionId = (): string => {
    let sessionId = sessionStorage.getItem("tracking_session_id");
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem("tracking_session_id", sessionId);
    }
    return sessionId;
};

export const getDeviceType = (): string => {
    const ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "TABLET";
    if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return "MOBILE";
    return "DESKTOP";
};

// === Core Tracking Function ===

export const logActivity = async (actionType: string, metadata: object = {}) => {
    if (!actionType) return;
    try {
        await axiosInstance.post("/tracking/log", {
            actionType,
            metadata: JSON.stringify(metadata),
            sessionId: getSessionId(),
            deviceType: getDeviceType(),
            referrer: document.referrer || "",
            pageUrl: window.location.pathname
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

export const getAnalytics = (days: number = 7) => {
    return axiosInstance.get(`/tracking/analytics?days=${days}`);
};
