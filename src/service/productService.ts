import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";
import type {
  ICreateProduct,
  IPrice,
  IProduct,
  IUpdateProduct,
} from "../types/product.type";

const BASE_URL = "/products";

export const ProductService = {
  getAll: async (
    page: number,
    size: number,
    search?: string,
    sort?: string,
  ): Promise<IApiResponse<IPagination<IProduct>>> => {
    const params: any = {
      page,
      size,
      filer: search ? `name~'${search}'` : undefined,
      sort: sort,
    };

    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  getById: async (id: number): Promise<IApiResponse<IProduct>> => {
    const res = await axiosInstance.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  getByName: async (name: string): Promise<IApiResponse<IProduct>> => {
    const params: any = { name };
    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  create: async (
    data: ICreateProduct,
    files?: File[],
  ): Promise<IApiResponse<IProduct>> => {
    const formData = new FormData();

    formData.append(
      "data",
      new Blob([JSON.stringify(data)], { type: "application/json" }),
    );

    if (files) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }

    const res = await axiosInstance.post(BASE_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },

  update: async (
    data: IUpdateProduct,
    files?: File[],
  ): Promise<IApiResponse<IProduct>> => {
    const formData = new FormData();

    formData.append(
      "data",
      new Blob([JSON.stringify(data)], { type: "application/json" }),
    );

    if (files) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }

    const res = await axiosInstance.put(BASE_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
  remove: async (id: number): Promise<IApiResponse<null>> => {
    const res = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
  getPrice: async (id: number): Promise<IApiResponse<IPrice>> => {
    const res = await axiosInstance.get(`/price/${id}`);
    return res.data;
  },
};
