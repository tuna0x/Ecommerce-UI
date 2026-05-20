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
    cancelReason?: string;
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
    paymentMethod: "COD" | "VNPAY" | "PAYOS";
    shippingFee?: number;
}) => {
    return axiosInstance.post("/order/checkout", data);
};

export type CheckoutStatus = "PROCESSING" | "SUCCESS" | "PAYMENT_REQUIRED" | "OUT_OF_STOCK" | "FAILED";

export interface CheckoutAsyncRes {
    checkoutId: string;
    status: CheckoutStatus;
    orderId?: number;
    paymentUrl?: string;
    message?: string;
}

export const checkoutAsyncApi = async (data: {
    addressId?: number | null;
    cartItemId: number[];
    couponCode?: string | null;
    paymentMethod: "COD" | "VNPAY" | "PAYOS";
    shippingFee?: number;
}) => {
    return axiosInstance.post("/order/checkout/async", data);
};

export const getCheckoutStatusApi = async (checkoutId: string) => {
    return axiosInstance.get(`/order/checkout/status/${checkoutId}`);
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

export const updateOrderStatusApi = async (id: number, status: string, reason?: string) => {
    const reasonParam = reason ? `&reason=${encodeURIComponent(reason)}` : "";
    return axiosInstance.put(`/order/${id}/status?status=${status}${reasonParam}`);
};

export const bulkUpdateOrderStatusApi = async (ids: number[], status: string, reason?: string) => {
    return axiosInstance.post("/order/bulk-status", { ids, status, reason });
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

