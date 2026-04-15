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
  toggleVerified: async (id: number, verified: boolean): Promise<IApiResponse<IUser>> => {
    const res = await axiosInstance.patch(`${BASE_URL}/${id}/verified`, { verified });
    return res.data;
  },

  updateRole: async (id: number, roleId: number): Promise<IApiResponse<IUser>> => {
    const res = await axiosInstance.patch(`${BASE_URL}/${id}/role`, { 
        role: { id: roleId } 
    });
    return res.data;
  },

  updateProfile: async (data: {
    id: number;
    name?: string;
    age?: number;
    gender?: string;
    image?: string;
  }, file?: File): Promise<IApiResponse<IUser>> => {
    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
    if (file) {
      formData.append("file", file);
    }
    const res = await axiosInstance.put(BASE_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
  getAnalytics: async (id: number): Promise<IApiResponse<any>> => {
    const res = await axiosInstance.get(`${BASE_URL}/${id}/analytics`);
    return res.data;
  },
  getAccountPermissions: async (): Promise<IApiResponse<any>> => {
    const res = await axiosInstance.get(`/auth/permissions`);
    return res.data;
  },
  updateAdminNotes: async (id: number, notes: string): Promise<IApiResponse<IUser>> => {
    const res = await axiosInstance.patch(`${BASE_URL}/${id}/admin-notes`, { notes });
    return res.data;
  },
};

