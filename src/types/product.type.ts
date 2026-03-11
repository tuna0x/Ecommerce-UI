import type { IAttributeValue } from "./attribute.type";
import type { IBrand } from "./brand.type";
import type { ICategory } from "./category.type";

export interface IProduct {
  id: number;
  name: string;
  originalPrice: number;
  stock: number;
  weight: number;
  image: string[] | null;
  category: ICategory;
  brand: IBrand;
  attributeValue: IAttributeValue[] | null;
}

export interface ICreateProduct {
  name: string;
  originalPrice: number;
  stock: number;
  weight: number;
  image: string[] | null;
  categoryId: number | null;
  brandId: number | null;
  attributeValue: number[] | undefined;
}

export interface IUpdateProduct {
  id: number;
  name: string;
  originalPrice: number;
  stock: number;
  weight: number;
  image: string[] | null;
  categoryId: number | null;
  brandId: number | null;
  attributeValue: number[] | null;
}

export interface IPrice {
  originalPrice: number;
  discountPrice: number;
  finalPrice: number;
}
