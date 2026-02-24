export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export const mockUsers: AdminUser[] = [
  {
    id: "USR-001",
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0901234567",
    role: "user",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    totalOrders: 5,
    totalSpent: 3500000,
  },
  {
    id: "USR-002",
    name: "Trần Thị B",
    email: "tranthib@example.com",
    phone: "0912345678",
    role: "user",
    status: "active",
    createdAt: "2024-01-05T00:00:00Z",
    totalOrders: 3,
    totalSpent: 1800000,
  },
  {
    id: "USR-003",
    name: "Lê Văn C",
    email: "levanc@example.com",
    phone: "0923456789",
    role: "admin",
    status: "active",
    createdAt: "2023-12-15T00:00:00Z",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: "USR-004",
    name: "Phạm Thị D",
    email: "phamthid@example.com",
    phone: "0934567890",
    role: "user",
    status: "inactive",
    createdAt: "2024-01-08T00:00:00Z",
    totalOrders: 1,
    totalSpent: 650000,
  },
  {
    id: "USR-005",
    name: "Hoàng Văn E",
    email: "hoangvane@example.com",
    phone: "0945678901",
    role: "user",
    status: "active",
    createdAt: "2024-01-10T00:00:00Z",
    totalOrders: 2,
    totalSpent: 2200000,
  },
  {
    id: "USR-006",
    name: "Admin",
    email: "admin@beautylux.com",
    phone: "0900000000",
    role: "admin",
    status: "active",
    createdAt: "2023-01-01T00:00:00Z",
    totalOrders: 0,
    totalSpent: 0,
  },
];
