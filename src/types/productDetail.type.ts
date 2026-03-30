import type { IProduct } from "./product.type";

export interface IProductDetail {
  id: number;
  description: string;
  ingredient: string;
  usageGuide: string;
  specification: string;
  product: IProduct;
}

export interface IReqCreateProductDetail {
  description: string;
  ingredient: string;
  usageGuide: string;
  specification: string;
  productId: number;
}

export interface IReqUpdateProductDetail {
  id: number;
  description: string;
  ingredient: string;
  usageGuide: string;
  specification: string;
  productId: number;
}
