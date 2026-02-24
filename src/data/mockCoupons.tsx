export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export const mockCoupons: Coupon[] = [
  {
    id: "1",
    code: "WELCOME10",
    name: "Chào mừng khách hàng mới",
    description: "Giảm 10% cho khách hàng đăng ký mới",
    type: "percentage",
    value: 10,
    maxDiscount: 100000,
    usageLimit: 1000,
    usedCount: 456,
    perUserLimit: 1,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    code: "SUMMER50K",
    name: "Mùa hè rực rỡ",
    description: "Giảm 50K cho đơn từ 300K",
    type: "fixed",
    value: 50000,
    minOrderValue: 300000,
    usageLimit: 500,
    usedCount: 234,
    perUserLimit: 2,
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    isActive: true,
    createdAt: "2024-05-28",
  },
  {
    id: "3",
    code: "VIP20",
    name: "Ưu đãi VIP",
    description: "Giảm 20% dành riêng cho VIP",
    type: "percentage",
    value: 20,
    maxDiscount: 200000,
    usageLimit: 100,
    usedCount: 45,
    perUserLimit: 5,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "4",
    code: "BIRTHDAY",
    name: "Sinh nhật vui vẻ",
    description: "Giảm 15% nhân dịp sinh nhật",
    type: "percentage",
    value: 15,
    maxDiscount: 150000,
    usageLimit: 0,
    usedCount: 128,
    perUserLimit: 1,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "5",
    code: "FLASH100K",
    name: "Flash Sale",
    description: "Giảm 100K cho đơn từ 500K",
    type: "fixed",
    value: 100000,
    minOrderValue: 500000,
    usageLimit: 200,
    usedCount: 200,
    perUserLimit: 1,
    startDate: "2024-07-01",
    endDate: "2024-07-07",
    isActive: false,
    createdAt: "2024-06-30",
  },
  {
    id: "6",
    code: "FREESHIP",
    name: "Miễn phí vận chuyển",
    description: "Miễn phí ship toàn quốc",
    type: "fixed",
    value: 30000,
    minOrderValue: 200000,
    usageLimit: 1000,
    usedCount: 678,
    perUserLimit: 3,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    isActive: true,
    createdAt: "2024-01-01",
  },
];
