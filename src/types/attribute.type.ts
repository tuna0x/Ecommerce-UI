import type { ICategory } from "./category.type";

export interface IAttribute {
  id: number;
  name: string;
  active: boolean;
  createAt: string;
  categories: ICategory[];
}

export interface IAttributeValue {
  id: number;
  attributeValue: string;
  attribute: IAttribute;
}

export interface ICreateAttribute {
  name: string;
  active: boolean;
  categoryIds: number[];
}

export interface IUpdateAttribute {
  id: number;
  name: string;
  active: boolean;
  categoryIds: number[];
}

export interface ICreateAttributeValue {
  attributeValue: string;
  attributeId: number | null;
}

export interface IUpdateAttributeValue {
  id: number;
  attributeValue: string;
  attributeId: number | null;
}
