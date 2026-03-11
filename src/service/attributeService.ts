import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";
import type {
  ICreateAttribute,
  IAttribute,
  IAttributeValue,
  ICreateAttributeValue,
  IUpdateAttribute,
  IUpdateAttributeValue,
} from "../types/attribute.type";
const ATTRIBUTE_URL = "/attributes";
const ATTRIBUTE_VALUE_URL = "/attributes-values";

export const attributeService = {
  getAll: async (
    page: number,
    size: number,
    search?: string,
    sort?: string,
  ): Promise<IApiResponse<IPagination<IAttribute>>> => {
    const params: any = {
      page,
      size,
      filer: search ? `name~'${search}'` : undefined,
      sort: sort,
    };

    const res = await axiosInstance.get(ATTRIBUTE_URL, { params });
    return res.data;
  },

  getById: async (id: number): Promise<IApiResponse<IAttribute>> => {
    const res = await axiosInstance.get(`${ATTRIBUTE_URL}/${id}`);
    return res.data;
  },

  getByName: async (name: string): Promise<IApiResponse<IAttribute>> => {
    const params: any = { name };
    const res = await axiosInstance.get(ATTRIBUTE_URL, { params });
    return res.data;
  },

  create: async (data: ICreateAttribute): Promise<IApiResponse<IAttribute>> => {
    const res = await axiosInstance.post(ATTRIBUTE_URL, data);
    return res.data;
  },

  update: async (data: IUpdateAttribute): Promise<IApiResponse<IAttribute>> => {
    const res = await axiosInstance.put(ATTRIBUTE_URL, data);
    return res.data;
  },
  remove: async (id: number): Promise<IApiResponse<null>> => {
    const res = await axiosInstance.delete(`${ATTRIBUTE_URL}/${id}`);
    return res.data;
  },
};

export const attributeValueService = {
  getAll: async (
    search?: string,
  ): Promise<IApiResponse<IPagination<IAttributeValue>>> => {
    const params: any = {
      filter: search ? `attribute.id='${search}'` : undefined,
    };

    const res = await axiosInstance.get(ATTRIBUTE_VALUE_URL, { params });
    return res.data;
  },

  getById: async (id: number): Promise<IApiResponse<IAttributeValue>> => {
    const res = await axiosInstance.get(`${ATTRIBUTE_VALUE_URL}/${id}`);
    return res.data;
  },

  getByName: async (name: string): Promise<IApiResponse<IAttributeValue>> => {
    const params: any = { name };
    const res = await axiosInstance.get(ATTRIBUTE_VALUE_URL, { params });
    return res.data;
  },

  create: async (
    data: ICreateAttributeValue,
  ): Promise<IApiResponse<IAttributeValue>> => {
    const res = await axiosInstance.post(ATTRIBUTE_VALUE_URL, data);
    return res.data;
  },

  update: async (
    data: IUpdateAttributeValue,
  ): Promise<IApiResponse<IAttributeValue>> => {
    const res = await axiosInstance.put(ATTRIBUTE_VALUE_URL, data);
    return res.data;
  },
  remove: async (id: number): Promise<IApiResponse<null>> => {
    const res = await axiosInstance.delete(`${ATTRIBUTE_VALUE_URL}/${id}`);
    return res.data;
  },
};
