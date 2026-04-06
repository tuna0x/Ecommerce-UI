import axios from "./axiosInstance";

export const addToCartApi = (productId: number, quantity: number, variantId?: number | null) => {
    return axios.post("/cart", {
        productId,
        quantity,
        variantId
    });
};

export const getCartApi = () => {
    return axios.get("/cart");
};

export const updateCartItemQuantityApi = (itemId: number, quantity: number) => {
    return axios.put("/cart", {
        itemId,
        quantity
    });
};

export const removeCartItemApi = (itemId: number) => {
    return axios.delete(`/cart/${itemId}`);
};
