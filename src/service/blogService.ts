import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";

export interface IBlog {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  readTime: string;
  createdAt: string;
  updatedAt: string;
}

const BASE_URL = "/blogs";

export const BlogService = {
  getAll: async (
    page?: number,
    size?: number,
    filter?: string,
    sort?: string
  ): Promise<IApiResponse<IPagination<IBlog>>> => {
    const params: Record<string, unknown> = {
      page: page && page > 0 ? page - 1 : 0,
      size: size || 10,
      filter,
      sort,
    };

    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  getById: async (id: number): Promise<IApiResponse<IBlog>> => {
    const res = await axiosInstance.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  create: async (blog: Partial<IBlog>, file?: File): Promise<IApiResponse<IBlog>> => {
    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(blog)], { type: "application/json" }));
    if (file) formData.append("file", file);

    const res = await axiosInstance.post(BASE_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  update: async (blog: Partial<IBlog>, file?: File): Promise<IApiResponse<IBlog>> => {
    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(blog)], { type: "application/json" }));
    if (file) formData.append("file", file);

    const res = await axiosInstance.put(BASE_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  remove: async (id: number): Promise<IApiResponse<void>> => {
    const res = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
};
