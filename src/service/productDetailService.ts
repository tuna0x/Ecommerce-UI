import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";
import type { IProductDetail, IReqCreateProductDetail, IReqUpdateProductDetail } from "../types/productDetail.type";

const BASE_URL = "/product-detail";

const productDetailService = {
  getAll: async (
    page: number,
    size: number,
    search?: string,
    sort?: string,
  ): Promise<IApiResponse<IPagination<IProductDetail>>> => {
    const params: Record<string, unknown> = {
      page: page,
      size: size,
      sort: sort || "id,desc",
    };
    if (search) params.filter = `description~'${search}' OR product.name~'${search}'`;
    
    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  getByProductId: async (productId: number): Promise<IApiResponse<IPagination<IProductDetail>>> => {
    const params = {
      filter: `product.id:'${productId}'`,
    };
    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  getById: async (id: number): Promise<IApiResponse<IProductDetail>> => {
    const res = await axiosInstance.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  create: async (data: IReqCreateProductDetail): Promise<IApiResponse<IProductDetail>> => {
    const res = await axiosInstance.post(BASE_URL, data);
    return res.data;
  },

  update: async (data: IReqUpdateProductDetail): Promise<IApiResponse<IProductDetail>> => {
    const res = await axiosInstance.put(BASE_URL, data);
    return res.data;
  },

  remove: async (id: number): Promise<IApiResponse<void>> => {
    const res = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
};

export default productDetailService;
