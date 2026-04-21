

export interface IProductAttributeValueResponse {
  attributeValue: {
    id: number;
    attributeValue: string;
    attribute: {
      id: number;
      name: string;
    };
  };
}

export interface IProductAttributeValue {
  id: number;
  attributeValue: string;
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
  costPrice?: number;
  weight?: number; // Legacy/Optional
  thumbnail?: string;
  image: string[] | string | null;
  productImages?: { id: number; imageUrl: string }[];
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
  flashSale?: {
    price: number;
    limitQuantity: number;
    soldQuantity: number;
    endAt: string;
  };
  active?: boolean;
}

export interface IVariantAttribute {
  name: string;
  attributeValue: string;
}

export interface IVariant {
  id: number;
  sku: string;
  price: number | null;
  costPrice?: number;
  discountPrice?: number;
  finalPrice?: number;
  stock: number;
  reservedStock: number;
  weight: number;
  image: string;
  productImageId?: number;
  variantAttributes: IVariantAttribute[];
}

export interface IVariantCreate {
  sku: string;
  price: number | null;
  costPrice?: number;
  stock: number;
  weight: number;
  productImageId?: number;
  productImageIndex?: number;
  attributeValues: number[];
}

export interface ICreateProduct {
  name: string;
  originalPrice: number;
  costPrice?: number;
  stock: number;
  image: string[] | null;
  categoryId: number | null;
  brandId: number | null;
  attributeValue: number[] | undefined;
  variants?: IVariantCreate[];
  active?: boolean;
}

export interface IUpdateProduct {
  id: number;
  name: string;
  originalPrice: number;
  costPrice?: number;
  stock: number;
  image: string[] | null;
  categoryId: number | null;
  brandId: number | null;
  attributeValue: number[] | null;
  variants?: IVariantCreate[];
  active?: boolean;
}

export interface IPrice {
  originalPrice: number;
  discountPrice: number;
  finalPrice: number;
}
