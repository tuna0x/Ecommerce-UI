import axiosInstance from "./axiosInstance";

export interface OrderRes {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    totalPrice: number;
    status: string;
    paymentStatus: string;
    shippingAddress: string;
    receiverName: string;
    phone: string;
    transactionID: string;
    paymentMethod: string;
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

export const getAllOrdersAdminApi = async (page: number, size: number, status?: string) => {
    const statusParam = status && status !== "all" ? `&status=${status}` : "";
    return axiosInstance.get(`/order/admin/all?page=${page - 1}&size=${size}${statusParam}`);
};

export const updateOrderStatusApi = async (id: number, status: string) => {
    return axiosInstance.put(`/order/${id}/status?status=${status}`);
};
