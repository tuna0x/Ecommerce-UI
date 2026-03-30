import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";
import type { IProduct } from "../types/product.type";
import type { IPromotion, IReqCreatePromotion, IReqUpdatePromotion } from "../types/promotion.type";

const BASE_URL = "/promotions";

export const PromotionService = {
  getAll: async (
    page?: number,
    size?: number,
  ): Promise<IApiResponse<IPagination<IPromotion>>> => {
    const params: Record<string, unknown> = {
      page: page !== undefined ? Math.max(page - 1, 0) : 0,
      size: size ? size : 10,
    };

    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  create: async (data: IReqCreatePromotion): Promise<IApiResponse<IPromotion>> => {
    const res = await axiosInstance.post(BASE_URL, data);
    return res.data;
  },

  update: async (data: IReqUpdatePromotion): Promise<IApiResponse<IPromotion>> => {
    const res = await axiosInstance.put(BASE_URL, data);
    return res.data;
  },

  delete: async (id: number): Promise<IApiResponse<void>> => {
    const res = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return res.data;
  },

  toggleActive: async (id: number, active: boolean): Promise<IApiResponse<void>> => {
    const res = await axiosInstance.patch(`${BASE_URL}/${id}/active`, null, {
      params: { active },
    });
    return res.data;
  },

  getById: async (id: number): Promise<IApiResponse<IPromotion>> => {
    const res = await axiosInstance.get(`${BASE_URL}/${id}`);
    return res.data;
  },
  
  getAssignedProducts: async (id: number): Promise<IApiResponse<IProduct[]>> => {
    const res = await axiosInstance.get(`${BASE_URL}/${id}/products`);
    return res.data;
  },

  assignProducts: async (id: number, productIds: number[]): Promise<IApiResponse<void>> => {
    const res = await axiosInstance.post(`${BASE_URL}/${id}/products`, productIds);
    return res.data;
  },

  assignAllProducts: async (id: number): Promise<IApiResponse<void>> => {
    const res = await axiosInstance.post(`${BASE_URL}/${id}/products/all`);
    return res.data;
  },
};
