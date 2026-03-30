import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";
import type { IBrand, ICreateBrand, IUpdateBrand } from "../types/brand.type";
const BASE_URL = "/brands";

export const BrandService = {
  getAll: async (
    page?: number,
    size?: number,
    search?: string,
    sort?: string,
  ): Promise<IApiResponse<IPagination<IBrand>>> => {
    const params: Record<string, unknown> = {
      page: page && page > 0 ? page - 1 : 0,
      size,
      filter: search ? `name~'${search}'` : undefined,
      sort: sort,
    };

    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  getById: async (id: number): Promise<IApiResponse<IBrand>> => {
    const res = await axiosInstance.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  getByName: async (name: string): Promise<IApiResponse<IBrand>> => {
    const params: Record<string, unknown> = { name };
    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  create: async (data: ICreateBrand, file?: File): Promise<IApiResponse<IBrand>> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });
    if (file) {
      formData.append("file", file);
    }

    const res = await axiosInstance.post(BASE_URL, formData);
    return res.data;
  },

  update: async (data: IUpdateBrand, file?: File): Promise<IApiResponse<IBrand>> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    if (file) {
      formData.append("file", file);
    }

    const res = await axiosInstance.put(BASE_URL, formData);
    return res.data;
  },
  remove: async (id: number): Promise<IApiResponse<null>> => {
    const res = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
};
