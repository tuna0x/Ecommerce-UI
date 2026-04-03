import type { IProduct, IVariantAttribute } from "./product.type";

export interface ICartItemResponse {
    id: number;
    quantity: number;
    unitPrice: number;
    product: IProduct;
    variantId: number | null;
    variantAttributes: IVariantAttribute[] | null;
}

export interface ICartResponse {
    item: ICartItemResponse[];
}
