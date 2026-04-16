import axiosInstance from "./axiosInstance";

export interface MonthlyRevenue {
    month: string;
    revenue: number;
    orderCount: number;
}

export interface ProductStat {
    name: string;
    quantity: number;
}

export interface CategoryStat {
    category: string;
    count: number;
    value: number;
    aov: number; // Added for detailed AOV
}

export interface ProductValueStat {
    name: string;
    value: number;
}

export interface InventorySummary {
    totalCapitalValue: number;
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
    topProductsByValue: ProductValueStat[];
}

export interface StatisticsData {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    topSellingProducts: ProductStat[];
    monthlyRevenue: MonthlyRevenue[];
    categoryDistribution: CategoryStat[];
    inventorySummary: InventorySummary;
    recentOrders: {
        id: number;
        transactionId: string;
        customerName: string;
        total: number;
        status: string;
        createdAt: string;
    }[];
    lowStockProducts: {
        id: number;
        name: string;
        image: string;
        stock: number;
    }[];
    // New fields
    orderStatusDistribution: Record<string, number>;
    newUsersCount: number;
    returningUsersCount: number;
    averageOrderValue: number;
    revenueGrowthRate: number;
    aovGrowthRate: number; // Added for detailed AOV trend
}

export interface APIResponse<T> {
    data: T;
    message?: string;
}

export const dashboardService = {
    getStatistics: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        
        const res = await axiosInstance.get<APIResponse<StatisticsData>>(
            `/dashboard/statistics?${params.toString()}`
        );
        return res.data.data;
    },
    exportExcel: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        
        const res = await axiosInstance.get(`/dashboard/export-excel?${params.toString()}`, {
            responseType: 'blob'
        });
        return res.data;
    }
};
