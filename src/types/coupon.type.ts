export type CouponType = "PERCENT" | "FIXED";
export type CouponStatus = "ACTIVE" | "DISABLED" | "EXPIRED";

export interface ICoupon {
  id: number;
  code: string;
  name: string;
  description: string;
  type: CouponType;
  value: number;
  startDate: string;
  endDate: string;
  minOrderValue?: number;
  maxDiscountValue?: number;
  usageLimit: number;
  usedCount: number;
  status: CouponStatus;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IReqCreateCoupon {
  code?: string;
  name: string;
  description: string;
  type: CouponType;
  value: number;
  startDate: string;
  endDate: string;
  minOrderValue?: number;
  maxDiscountValue?: number;
  usageLimit: number;
  status: CouponStatus;
  isPublic: boolean;
}

export interface IReqUpdateCoupon extends IReqCreateCoupon {
  id: number;
}
