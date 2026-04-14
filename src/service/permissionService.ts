import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";
import type { IPermission } from "../types/permission.type";

const BASE_URL = "/permissions";

export const PermissionService = {
  getAll: async (
    page?: number,
    size?: number,
    filter?: string
  ): Promise<IApiResponse<IPagination<IPermission>>> => {
    const params: Record<string, unknown> = {
      page: page && page > 0 ? page - 1 : 0,
      size: size ? size : 100,
      filter: filter || ""
    };

    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  getById: async (id: number): Promise<IApiResponse<IPermission>> => {
    const res = await axiosInstance.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  create: async (permission: Partial<IPermission>): Promise<IApiResponse<IPermission>> => {
    const res = await axiosInstance.post(BASE_URL, permission);
    return res.data;
  },

  update: async (permission: Partial<IPermission>): Promise<IApiResponse<IPermission>> => {
    const res = await axiosInstance.put(BASE_URL, permission);
    return res.data;
  },

  delete: async (id: number): Promise<IApiResponse<void>> => {
    const res = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return res.data;
  }
};
