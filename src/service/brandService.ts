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
    const params: any = {
      page,
      size,
      filer: search ? `name~'${search}'` : undefined,
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
    const params: any = { name };
    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  create: async (data: ICreateBrand): Promise<IApiResponse<IBrand>> => {
    const res = await axiosInstance.post(BASE_URL, data);
    return res.data;
  },

  update: async (data: IBrand): Promise<IApiResponse<IBrand>> => {
    const res = await axiosInstance.put(BASE_URL, data);
    return res.data;
  },
  remove: async (id: number): Promise<IApiResponse<null>> => {
    const res = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
};
