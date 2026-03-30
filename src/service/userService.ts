import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";
import type { IUser } from "../types/user.type";

const BASE_URL = "/users";

export const UserService = {
  getAll: async (
    page?: number,
    size?: number,
    filter?: string,
    sort?: string,
  ): Promise<IApiResponse<IPagination<IUser>>> => {
    const params: Record<string, unknown> = {
      page: page && page > 0 ? page - 1 : 0,
      size: size ? size : 10,
      filter: filter,
      sort: sort,
    };

    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  toggleActive: async (id: number, active: boolean): Promise<IApiResponse<IUser>> => {
    const res = await axiosInstance.patch(`${BASE_URL}/${id}/active`, { active });
    return res.data;
  },

  updateRole: async (id: number, roleId: number): Promise<IApiResponse<IUser>> => {
    const res = await axiosInstance.patch(`${BASE_URL}/${id}/role`, { 
        role: { id: roleId } 
    });
    return res.data;
  },
};
