import axiosInstance from "./axiosInstance";

export const newsletterService = {
    subscribe: async (email: string) => {
        return axiosInstance.post("/subscribers", { email });
    }
};
