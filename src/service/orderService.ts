import axiosInstance from "./axiosInstance";

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
    return axiosInstance.post("/api/v1/order/checkout", payload);
};
