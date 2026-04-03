import axios from "./axiosInstance";

export const addToCartApi = (productId: number, quantity: number, variantId?: number | null) => {
    return axios.post("/api/v1/cart", {
        productId,
        quantity,
        variantId
    });
};

export const getCartApi = () => {
    return axios.get("/api/v1/cart");
};

export const updateCartItemQuantityApi = (itemId: number, quantity: number) => {
    return axios.put("/api/v1/cart", {
        itemId,
        quantity
    });
};

export const removeCartItemApi = (itemId: number) => {
    return axios.delete(`/api/v1/cart/${itemId}`);
};
