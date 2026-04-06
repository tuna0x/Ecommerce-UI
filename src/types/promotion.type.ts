export type PromotionType = "PERCENT" | "FIXED" | "BUY_X_GET_Y" | "FREE_SHIPPING";

export interface IPromotion {
  id: number;
  name: string;
  description: string;
  type: PromotionType;
  value: number;
  minOrderValue?: number;
  maxDiscountValue?: number;
  startAt: string;
  endAt: string;
  active: boolean;
  global: boolean;
  categoryId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IReqCreatePromotion {
  name: string;
  description: string;
  type: PromotionType;
  value: number;
  minOrderValue?: number;
  maxDiscountValue?: number;
  startAt: string;
  endAt: string;
  active: boolean;
  global: boolean;
  categoryId?: number;
}

export interface IReqUpdatePromotion extends IReqCreatePromotion {
  id: number;
  active: boolean;
}
