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

export interface ResultPaginationDTO<T> {
    meta: {
        page: number;
        pageSize: number;
        total: number;
        pages: number;
    };
    result: T[];
}

export const inventoryService = {
    getAllInventory: async (page: number = 1, pageSize: number = 20, query: string = "") => {
        const res = await axiosInstance.get<APIResponse<ResultPaginationDTO<Inventory>>>(
            `/inventory?page=${page - 1}&size=${pageSize}${query}`
        );
        return res.data.data;
    },

    getAllInventoryForSummary: async (query: string = "", pageSize: number = 10000) => {
        const firstPage = await inventoryService.getAllInventory(1, pageSize, query);
        const allItems = [...(firstPage.result || [])];
        const pages = firstPage.meta?.pages || 1;

        if (pages > 1) {
            const remainingPages = await Promise.all(
                Array.from({ length: pages - 1 }, (_, index) =>
                    inventoryService.getAllInventory(index + 2, pageSize, query)
                )
            );
            remainingPages.forEach(page => allItems.push(...(page.result || [])));
        }

        return allItems;
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
        const res = await axiosInstance.get<APIResponse<ResultPaginationDTO<InventoryLog>>>(
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
