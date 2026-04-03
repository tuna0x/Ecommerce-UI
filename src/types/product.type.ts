

export interface IProductAttributeValueResponse {
  attributeValue: {
    id: number;
    value: string;
    attribute: {
      id: number;
      name: string;
    };
  };
}

export interface IProductAttributeValue {
  id: number;
  value: string;
  attributeId?: number;
  attributeName?: string;
}

export interface IProduct {
  id: number;
  name: string;
  description?: string;
  originalPrice: number;
  discountPrice?: number;
  finalPrice: number;
  stock: number;
  weight?: number; // Legacy/Optional
  thumbnail?: string;
  image: string[] | string | null;
  category: { id: number; name: string } | string;
  brand: { id: number; name: string } | string;
  attributeValue: IProductAttributeValue[] | null;
  averageRating?: number;
  reviewCount?: number;
  // UI-specific legacy support
  price?: number; 
  rating?: number;
  soldCount?: number;
  hoverImage?: string;
  discount?: number;
  skinType?: string[];
  concern?: string[];
  volume?: string;
  variants?: IVariant[];
}

export interface IVariantAttribute {
  name: string;
  value: string;
}

export interface IVariant {
  id: number;
  sku: string;
  price: number | null;
  stock: number;
  weight: number;
  variantAttributes: IVariantAttribute[];
}

export interface IVariantCreate {
  sku: string;
  price: number | null;
  stock: number;
  weight: number;
  attributeValues: number[];
}

export interface ICreateProduct {
  name: string;
  originalPrice: number;
  stock: number;
  image: string[] | null;
  categoryId: number | null;
  brandId: number | null;
  attributeValue: number[] | undefined;
  variants?: IVariantCreate[];
}

export interface IUpdateProduct {
  id: number;
  name: string;
  originalPrice: number;
  stock: number;
  image: string[] | null;
  categoryId: number | null;
  brandId: number | null;
  attributeValue: number[] | null;
  variants?: IVariantCreate[];
}

export interface IPrice {
  originalPrice: number;
  discountPrice: number;
  finalPrice: number;
}
