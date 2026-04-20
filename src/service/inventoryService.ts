import axiosInstance from "./axiosInstance";

export interface InventoryLog {
    id: number;
    inventory?: Inventory;
    quantityChange: number;
    type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOSS' | 'RESERVE' | 'RELEASE';
    note: string;
    oldCostPrice?: number;
    newCostPrice?: number;
    createdAt: string;
    createdBy?: string;
}

export interface Inventory {
    id: number;
    productVariant: {
        id: number;
        sku: string;
        product: {
            id: number;
            name: string;
            thumbnail: string;
            categoryName?: string;
        };
    };
    stock: number;
    reservedStock: number;
    costPrice: number;
    minStockThreshold: number;
    maxStock: number;
    updatedAt: string;
}

export interface InventoryAdjustPayload {
    productId: number;
    variantId?: number | null;
    quantity: number;
    type: string;
    note: string;
    costPrice?: number;
    minStockThreshold?: number;
    maxStock?: number;
}

export interface APIResponse<T> {
    data: T;
    message?: string;
}

export interface ResultPaginationDTO {
    meta: {
        page: number;
        pageSize: number;
        total: number;
        pages: number;
    };
    result: InventoryLog[];
}

export const inventoryService = {
    getAllInventory: async () => {
        const res = await axiosInstance.get<APIResponse<Inventory[]>>("/inventory");
        return res.data.data;
    },

    adjustInventory: async (payload: InventoryAdjustPayload) => {
        const res = await axiosInstance.post<APIResponse<Inventory>>("/inventory/adjust", payload);
        return res.data.data;
    },

    bulkAdjustInventory: async (payload: InventoryAdjustPayload[]) => {
        const res = await axiosInstance.post<APIResponse<Inventory[]>>("/inventory/bulk-adjust", payload);
        return res.data.data;
    },

    getInventoryLogs: async (id: number) => {
        const res = await axiosInstance.get<APIResponse<InventoryLog[]>>(`/inventory/${id}/logs`);
        return res.data.data;
    },

    getInventoryLogsAll: async (page: number = 1, pageSize: number = 20, query: string = "") => {
        const res = await axiosInstance.get<APIResponse<ResultPaginationDTO>>(
            `/inventory/logs?page=${page - 1}&size=${pageSize}${query}`
        );
        return res.data.data;
    },

    exportInventoryLogs: async (query: string = "") => {
        const res = await axiosInstance.get(`/inventory/logs/export?${query}`, {
            responseType: 'blob'
        });
        return res.data;
    }
};
