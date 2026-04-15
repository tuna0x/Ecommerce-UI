import axiosInstance from "./axiosInstance";

export const wishlistService = {
  getWishlist: async () => {
    const res = await axiosInstance.get<any>("/wishlist");
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
    const res = await axiosInstance.get<any>(`/wishlist/check/${productId}`);
    return res.data?.data ?? false;
  },
};
