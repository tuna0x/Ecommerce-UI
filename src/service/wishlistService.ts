import axiosInstance from "./axiosInstance";
import type { IApiResponse } from "../types/api.type";
import type { IProduct } from "../types/product.type";

export const wishlistService = {
  getWishlist: async () => {
    const res = await axiosInstance.get<IApiResponse<IProduct[]>>("/wishlist");
    return res.data?.data || [];
  },

  addToWishlist: async (productId: number) => {
    const res = await axiosInstance.post(`/wishlist/${productId}`);
    return res.data;
  },

  removeFromWishlist: async (productId: number) => {
    const res = await axiosInstance.delete(`/wishlist/${productId}`);
    return res.data;
  },

  checkWishlist: async (productId: number) => {
    const res = await axiosInstance.get<IApiResponse<boolean>>(`/wishlist/check/${productId}`);
    return res.data?.data ?? false;
  },
};
