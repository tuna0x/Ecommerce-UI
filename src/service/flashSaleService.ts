import axiosInstance from './axiosInstance';
import type { IApiResponse } from '../types/api.type';

export interface FlashSaleItemRequest {
    productId: number;
    variantId?: number;
    flashSalePrice: number;
    limitQuantity: number;
}

export interface ReqFlashSaleCampaignDTO {
    name: string;
    description: string;
    startAt: string;
    endAt: string;
    items: FlashSaleItemRequest[];
}

export interface FlashSaleItem {
    id: number;
    productId: number;
    productName: string;
    productImage?: string;
    variantId?: number;
    variantSku?: string;
    flashSalePrice: number;
    limitQuantity: number;
    soldQuantity: number;
}

export interface FlashSaleCampaign {
    id: number;
    name: string;
    description: string;
    startAt: string;
    endAt: string;
    active: boolean;
    items: FlashSaleItem[];
}

export const flashSaleService = {
    createCampaign: async (data: ReqFlashSaleCampaignDTO) => {
        const response = await axiosInstance.post<IApiResponse<FlashSaleCampaign>>('/flash-sales', data);
        return response.data.data;
    },

    getAllCampaigns: async (): Promise<FlashSaleCampaign[]> => {
        const response = await axiosInstance.get<IApiResponse<FlashSaleCampaign[]>>('/flash-sales');
        return response.data.data || [];
    },

    deleteCampaign: async (id: number) => {
        await axiosInstance.delete(`/flash-sales/${id}`);
    },

    updateCampaign: async (id: number, data: ReqFlashSaleCampaignDTO) => {
        const response = await axiosInstance.put<IApiResponse<FlashSaleCampaign>>(`/flash-sales/${id}`, data);
        return response.data.data;
    },
    
    getActiveCampaign: async (): Promise<FlashSaleCampaign | null> => {
        try {
            const response = await axiosInstance.get<IApiResponse<FlashSaleCampaign>>('/flash-sales/active');
            return response.data.data ?? null;
        } catch (error) {
            return null;
        }
    }
};
