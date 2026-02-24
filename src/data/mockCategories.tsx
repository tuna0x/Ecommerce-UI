export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

export const mockCategories: Category[] = [
  {
    id: "1",
    name: "Chăm sóc da",
    slug: "cham-soc-da",
    description: "Các sản phẩm chăm sóc da mặt và body",
    isActive: true,
    productCount: 45,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Trang điểm",
    slug: "trang-diem",
    description: "Mỹ phẩm trang điểm cao cấp",
    isActive: true,
    productCount: 32,
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    name: "Chăm sóc tóc",
    slug: "cham-soc-toc",
    description: "Dầu gội, dầu xả và sản phẩm dưỡng tóc",
    isActive: true,
    productCount: 28,
    createdAt: "2024-02-01",
  },
  {
    id: "4",
    name: "Nước hoa",
    slug: "nuoc-hoa",
    description: "Nước hoa nam nữ các thương hiệu",
    isActive: true,
    productCount: 15,
    createdAt: "2024-02-10",
  },
  {
    id: "5",
    name: "Serum",
    slug: "serum",
    description: "Serum dưỡng da chuyên sâu",
    parentId: "1",
    isActive: true,
    productCount: 12,
    createdAt: "2024-02-15",
  },
  {
    id: "6",
    name: "Kem chống nắng",
    slug: "kem-chong-nang",
    description: "Bảo vệ da khỏi tia UV",
    parentId: "1",
    isActive: true,
    productCount: 8,
    createdAt: "2024-02-20",
  },
];
