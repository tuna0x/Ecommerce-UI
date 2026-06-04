import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";
import type { IUser, IUserAnalytics } from "../types/user.type";
import type { IPermission } from "../types/permission.type";

const BASE_URL = "/users";

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

type CreateUserPayload = Omit<Partial<IUser>, "id" | "role"> & {
  email: string;
  name: string;
  password?: string;
  role?: { id: number };
};

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
    phoneNumber?: string;
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
  getAnalytics: async (id: number): Promise<IApiResponse<IUserAnalytics>> => {
    const res = await axiosInstance.get(`${BASE_URL}/${id}/analytics`);
    return res.data;
  },
  getAccountPermissions: async (): Promise<IApiResponse<IPermission[]>> => {
    const res = await axiosInstance.get(`/auth/permissions`);
    return res.data;
  },
  updateAdminNotes: async (id: number, notes: string): Promise<IApiResponse<IUser>> => {
    const res = await axiosInstance.patch(`${BASE_URL}/${id}/admin-notes`, { notes });
    return res.data;
  },
  changePassword: async (data: ChangePasswordPayload): Promise<IApiResponse<void>> => {
    const res = await axiosInstance.post(`/auth/change-password`, data);
    return res.data;
  },

  create: async (data: CreateUserPayload): Promise<IApiResponse<IUser>> => {
    const res = await axiosInstance.post(BASE_URL, data);
    return res.data;
  },

  delete: async (id: number): Promise<IApiResponse<string>> => {
    const res = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
};


