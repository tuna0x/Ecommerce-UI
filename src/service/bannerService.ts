import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";
import type { IBanner, ICreateBanner, IUpdateBanner } from "../types/banner.type";

const BASE_URL = "/banners";

export const BannerService = {
  getAll: async (
    page?: number,
    size?: number,
    search?: string,
    sort?: string,
  ): Promise<IApiResponse<IPagination<IBanner>>> => {
    const params: Record<string, unknown> = {
      page: page !== undefined ? page : 0,
      size,
      filter: search ? `title~'${search}'` : undefined,
      sort: sort,
    };

    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  getById: async (id: number): Promise<IApiResponse<IBanner>> => {
    const res = await axiosInstance.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  create: async (data: ICreateBanner, file?: File): Promise<IApiResponse<IBanner>> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    if (file) {
      formData.append("file", file);
    }

    const res = await axiosInstance.post(BASE_URL, formData);
    return res.data;
  },

  update: async (data: IUpdateBanner, file?: File): Promise<IApiResponse<IBanner>> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
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

  toggleActive: async (id: number, isActive: boolean): Promise<IApiResponse<IBanner>> => {
    const res = await axiosInstance.patch(`${BASE_URL}/${id}/active`, null, {
      params: { isActive },
    });
    return res.data;
  },
};
