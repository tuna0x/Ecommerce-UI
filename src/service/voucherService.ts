import axiosInstance from './axiosInstance';
import type { IApiResponse } from '../types/api.type';

export interface Coupon {
    id: number;
    code: string;
    name: string;
    description: string;
    type: 'PERCENT' | 'FIXED' | 'FREE_SHIPPING';
    discountValue: number;
    startDate: string;
    endDate: string;
    minOrderValue: number;
    maxDiscountValue: number;
    usageLimit: number;
    usedCount: number;
    status: 'ACTIVE' | 'DISABLED';
    isPublic: boolean;
}

export interface UserCoupon {
    id: number;
    coupon: Coupon;
    isUsed: boolean;
    collectedAt: string;
    usedAt: string | null;
}

export const voucherService = {
    getMyVouchers: (): Promise<IApiResponse<UserCoupon[]>> => {
        return axiosInstance.get('/user-coupons/my').then(res => res.data);
    },

    getAvailableVouchers: (): Promise<IApiResponse<Coupon[]>> => {
        return axiosInstance.get('/user-coupons/available').then(res => res.data);
    },

    collectVoucher: (id: number): Promise<IApiResponse<UserCoupon>> => {
        return axiosInstance.post(`/user-coupons/collect/${id}`).then(res => res.data);
    },

    validateCoupon: (code: string): Promise<IApiResponse<Coupon>> => {
        return axiosInstance.get(`/coupons/validate?code=${code}`).then(res => res.data);
    }
};
