import axiosInstance from "./axiosInstance";

export interface InventoryLog {
    id: number;
    quantityChange: number;
    type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOSS' | 'RESERVE' | 'RELEASE';
    note: string;
    createdAt: string;
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
        };
    };
    stock: number;
    reservedStock: number;
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
    minStockThreshold?: number;
    maxStock?: number;
}

export interface APIResponse<T> {
    data: T;
    message?: string;
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
    }
};
