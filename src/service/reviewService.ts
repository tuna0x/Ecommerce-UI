import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";

export interface IReview {
  id: number;
  rating: number;
  comment: string;
  userName: string;
  userImage?: string;
  createdAt: string;
  images?: string[];
  productName?: string;
}

export const reviewService = {
  createReview: async (productId: number, rating: number, comment: string, files?: File[]): Promise<IApiResponse<IReview>> => {
    const formData = new FormData();
    formData.append("productId", productId.toString());
    formData.append("rating", rating.toString());
    formData.append("comment", comment);
    
    if (files) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }

    const res = await axiosInstance.post("/reviews", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  getReviewsByProduct: async (productId: number, page: number = 1, size: number = 10): Promise<IApiResponse<IPagination<IReview>>> => {
    const res = await axiosInstance.get(`/reviews/product/${productId}`, {
      params: {
        page: page - 1,
        size: size,
      },
    });
    return res.data;
  },

  getFeaturedReviews: async (minRating: number = 5, page: number = 1, size: number = 10): Promise<IApiResponse<IPagination<IReview>>> => {
    const res = await axiosInstance.get("/reviews/featured", {
      params: {
        minRating,
        page: page - 1,
        size,
      },
    });
    return res.data;
  },

  deleteReview: async (id: number): Promise<IApiResponse<void>> => {
    const res = await axiosInstance.delete(`/reviews/${id}`);
    return res.data;
  },
};
