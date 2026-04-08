import type { AxiosResponse } from "axios";
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
}

export const reviewService = {
  createReview: async (productId: number, rating: number, comment: string, files?: File[]): Promise<AxiosResponse<IApiResponse<IReview>>> => {
    const formData = new FormData();
    formData.append("productId", productId.toString());
    formData.append("rating", rating.toString());
    formData.append("comment", comment);
    
    if (files) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }

    return axiosInstance.post("/reviews", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getReviewsByProduct: async (productId: number, page: number = 1, size: number = 10): Promise<AxiosResponse<IApiResponse<IPagination<IReview>>>> => {
    return axiosInstance.get(`/reviews/product/${productId}`, {
      params: {
        page: page - 1,
        size: size,
      },
    });
  },

  deleteReview: async (id: number): Promise<AxiosResponse<IApiResponse<void>>> => {
    return axiosInstance.delete(`/reviews/${id}`);
  },
};
