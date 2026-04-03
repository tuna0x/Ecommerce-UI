

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
}

export interface IProduct {
  id: number;
  name: string;
  description?: string;
  originalPrice: number;
  discountPrice?: number;
  finalPrice: number;
  stock: number;
  weight: number;
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
