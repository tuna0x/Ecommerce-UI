import type { ICategory } from "./category.type";

export interface IAttribute {
  id: number;
  name: string;
  active: boolean;
  createAt: string;
  category: ICategory;
}

export interface IAttributeValue {
  id: number;
  value: string;
  attribute: IAttribute;
}

export interface ICreateAttribute {
  name: string;
  active: boolean;
  categoryId: number | null;
}

export interface IUpdateAttribute {
  id: number;
  name: string;
  active: boolean;
  categoryId: number | null;
}

export interface ICreateAttributeValue {
  value: string;
  attributeId: number | null;
}

export interface IUpdateAttributeValue {
  id: number;
  value: string;
  attributeId: number | null;
}
