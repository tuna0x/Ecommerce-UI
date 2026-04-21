import axiosInstance from "./axiosInstance";

export interface TransactionRes {
    id: number;
    order?: {
        id: number;
    };
    amount: number;
    paymentMethod: string;
    status: string;
    externalId?: string;
    external_id?: string; // Add snake_case variant in case backend returns it
    rawData: string;
    createdAt: string;
    createdBy: string;
}

export const getAllTransactionsAdminApi = async (
    page: number, 
    size: number, 
    status?: string, 
    startDate?: string, 
    endDate?: string,
    externalId?: string
) => {
    const statusParam = status && status !== "all" ? `&status=${status}` : "";
    const startParam = startDate ? `&startDate=${startDate}` : "";
    const endParam = endDate ? `&endDate=${endDate}` : "";
    const idParam = externalId ? `&externalId=${externalId}` : "";
    
    return axiosInstance.get(`/transactions?page=${page - 1}&size=${size}${statusParam}${startParam}${endParam}${idParam}`);
};
