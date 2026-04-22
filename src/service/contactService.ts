import axiosInstance from "./axiosInstance";

export interface ContactFormData {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
}

export const contactService = {
    sendContactMessage: async (data: ContactFormData) => {
        return axiosInstance.post("/public/contact", data);
    }
};
