import axiosInstance from "./axiosInstance";

export interface OrderRes {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    totalPrice: number;
    subTotal: number;
    shippingFee: number;
    status: string;
    paymentStatus: string;
    shippingAddress: string;
    receiverName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    transactionID: string;
    paymentMethod: string;
    paymentUrl?: string;
    shippingCode?: string;
    deliveredAt?: string;
    confirmedAt?: string;
    discountPrice?: number;
    createdAt?: string;
    items?: {
        productId: number;
        productName: string;
        productImage: string;
        quantity: number;
        price: number;
    }[];
}

export const checkoutApi = async (data: {
    addressId?: number | null;
    cartItemId: number[];
    couponCode?: string | null;
    paymentMethod: "COD" | "VNPAY" | "MOMO" | "BANKING";
}) => {
    // Note: The backend PaymentMethodEnum might just support COD and VNPAY
    const payload = {
        ...data,
        paymentMethod: data.paymentMethod === "VNPAY" || data.paymentMethod === "BANKING" ? "VNPAY" : "COD"
    };
    return axiosInstance.post("/order/checkout", payload);
};

export const getMyOrdersApi = async (page: number, size: number) => {
    return axiosInstance.get(`/order/me?page=${page - 1}&size=${size}`);
};

export const getOrderByIdApi = async (id: number) => {
    return axiosInstance.get(`/order/${id}`);
};

export const getAllOrdersAdminApi = async (page: number, size: number, status?: string, startDate?: string, endDate?: string) => {
    const statusParam = status && status !== "all" ? `&status=${status}` : "";
    const startParam = startDate ? `&startDate=${startDate}` : "";
    const endParam = endDate ? `&endDate=${endDate}` : "";
    return axiosInstance.get(`/order/admin/all?page=${page - 1}&size=${size}${statusParam}${startParam}${endParam}`);
};

export const updateOrderStatusApi = async (id: number, status: string) => {
    return axiosInstance.put(`/order/${id}/status?status=${status}`);
};

export const bulkUpdateOrderStatusApi = async (ids: number[], status: string) => {
    return axiosInstance.post("/order/bulk-status", { ids, status });
};

export const cancelOrderApi = async (id: number, reason: string) => {
    return axiosInstance.put(`/order/${id}/cancel?reason=${encodeURIComponent(reason)}`);
};

export const createGhnOrderApi = async (id: number) => {
    return axiosInstance.post(`/order/${id}/ghn`);
};

export const bulkCreateGhnOrdersApi = async (ids: number[]) => {
    return axiosInstance.post("/order/bulk-ghn", ids);
};

export const updateOrderAddressApi = async (id: number, data: Partial<OrderRes>) => {
    return axiosInstance.put(`/order/${id}/address`, data);
};

