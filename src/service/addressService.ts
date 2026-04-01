import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";

export interface IAddress {
  id: number;
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
  isDefault: boolean;
  userInner: {
    id: number;
    email: string;
    name: string;
  };
}

export interface ICreateAddress {
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
}

export interface IUpdateAddress extends ICreateAddress {
  id: number;
}

const BASE_URL = "/addresses";

export const AddressService = {
  getAll: async (page = 0, size = 10): Promise<IApiResponse<IPagination<IAddress>>> => {
    const res = await axiosInstance.get(BASE_URL, {
      params: { page, size },
    });
    return res.data;
  },

  create: async (data: ICreateAddress): Promise<IApiResponse<IAddress>> => {
    const res = await axiosInstance.post(BASE_URL, data);
    return res.data;
  },

  update: async (data: IUpdateAddress): Promise<IApiResponse<IAddress>> => {
    const res = await axiosInstance.put(BASE_URL, data);
    return res.data;
  },

  remove: async (id: number): Promise<IApiResponse<void>> => {
    const res = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return res.data;
  },

  setDefault: async (id: number): Promise<IApiResponse<string>> => {
    const res = await axiosInstance.put(`${BASE_URL}/${id}/default`);
    return res.data;
  },
};
