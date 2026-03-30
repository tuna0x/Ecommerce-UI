import axiosInstance from "./axiosInstance";
import type { IApiResponse, IPagination } from "../types/api.type";
import type { ICoupon, IReqCreateCoupon, IReqUpdateCoupon } from "../types/coupon.type";

const BASE_URL = "/coupons";

export const CouponService = {
  getAll: async (
    page?: number,
    size?: number,
  ): Promise<IApiResponse<IPagination<ICoupon>>> => {
    const params: Record<string, unknown> = {
      page: page !== undefined ? page : 0,
      size: size ? size : 10,
    };

    const res = await axiosInstance.get(BASE_URL, { params });
    return res.data;
  },

  create: async (data: IReqCreateCoupon): Promise<IApiResponse<ICoupon>> => {
    const res = await axiosInstance.post(BASE_URL, data);
    return res.data;
  },

  update: async (data: IReqUpdateCoupon): Promise<IApiResponse<ICoupon>> => {
    const res = await axiosInstance.put(BASE_URL, data);
    return res.data;
  },

  delete: async (id: number): Promise<IApiResponse<void>> => {
    const res = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return res.data;
  },

  toggleActive: async (id: number, active: boolean): Promise<IApiResponse<void>> => {
    const res = await axiosInstance.patch(`${BASE_URL}/${id}/active`, null, {
      params: { active },
    });
    return res.data;
  },

  getById: async (id: number): Promise<IApiResponse<ICoupon>> => {
    const res = await axiosInstance.get(`${BASE_URL}/${id}`);
    return res.data;
  },
};
