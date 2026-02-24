export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: "percentage" | "fixed" | "buy_x_get_y" | "free_shipping";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableProducts: "all" | "category" | "specific";
  categoryIds?: string[];
  productIds?: string[];
  usageCount: number;
  createdAt: string;
}

export const mockPromotions: Promotion[] = [
  {
    id: "1",
    name: "Flash Sale Mùa Hè",
    description: "Giảm giá 30% cho tất cả sản phẩm chăm sóc da",
    type: "percentage",
    value: 30,
    maxDiscount: 500000,
    startDate: "2024-06-01",
    endDate: "2024-06-30",
    isActive: true,
    applicableProducts: "category",
    categoryIds: ["1"],
    usageCount: 156,
    createdAt: "2024-05-25",
  },
  {
    id: "2",
    name: "Miễn phí vận chuyển",
    description: "Miễn phí ship cho đơn hàng từ 300K",
    type: "free_shipping",
    value: 0,
    minOrderValue: 300000,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    isActive: true,
    applicableProducts: "all",
    usageCount: 1245,
    createdAt: "2024-01-01",
  },
  {
    id: "3",
    name: "Mua 2 Tặng 1",
    description: "Mua 2 sản phẩm son môi tặng 1 sản phẩm",
    type: "buy_x_get_y",
    value: 1,
    startDate: "2024-07-01",
    endDate: "2024-07-15",
    isActive: false,
    applicableProducts: "specific",
    productIds: ["101", "102", "103"],
    usageCount: 89,
    createdAt: "2024-06-28",
  },
  {
    id: "4",
    name: "Giảm 100K",
    description: "Giảm ngay 100K cho đơn từ 500K",
    type: "fixed",
    value: 100000,
    minOrderValue: 500000,
    startDate: "2024-07-10",
    endDate: "2024-07-20",
    isActive: true,
    applicableProducts: "all",
    usageCount: 234,
    createdAt: "2024-07-08",
  },
  {
    id: "5",
    name: "Ưu đãi Thành viên VIP",
    description: "Giảm 15% cho thành viên VIP",
    type: "percentage",
    value: 15,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    isActive: true,
    applicableProducts: "all",
    usageCount: 567,
    createdAt: "2024-01-01",
  },
];
