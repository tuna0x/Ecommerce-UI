import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";
import type { IRole } from "../types/role.type";

const BASE_URL = "/roles";

export const RoleService = {
  getAll: async (
    page?: number,
    size?: number,
  ): Promise<IApiResponse<IPagination<IRole>>> => {
    const params: Record<string, unknown> = {
      page: page && page > 0 ? page - 1 : 0,
      size: size ? size : 100,
    };

    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },
};
