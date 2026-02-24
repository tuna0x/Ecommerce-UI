export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  items: {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
  paymentMethod: "cod" | "bank" | "momo";
  createdAt: string;
}

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "Nguyễn Văn A",
    customerEmail: "nguyenvana@example.com",
    customerPhone: "0901234567",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    items: [
      {
        productId: 1,
        productName: "Serum Vitamin C 15% Làm Sáng Da",
        quantity: 2,
        price: 459000,
      },
      {
        productId: 2,
        productName: "Kem Chống Nắng SPF50+ PA++++",
        quantity: 1,
        price: 425000,
      },
    ],
    total: 1343000,
    status: "pending",
    paymentMethod: "cod",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "ORD-002",
    customerName: "Trần Thị B",
    customerEmail: "tranthib@example.com",
    customerPhone: "0912345678",
    address: "456 Lê Lợi, Quận 3, TP.HCM",
    items: [
      {
        productId: 3,
        productName: "Son Kem Lì Màu Đỏ Cherry",
        quantity: 1,
        price: 520000,
      },
    ],
    total: 520000,
    status: "confirmed",
    paymentMethod: "momo",
    createdAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "ORD-003",
    customerName: "Lê Văn C",
    customerEmail: "levanc@example.com",
    customerPhone: "0923456789",
    address: "789 Hai Bà Trưng, Quận 1, TP.HCM",
    items: [
      {
        productId: 7,
        productName: "Kem Dưỡng Ẩm Cấp Nước 72H",
        quantity: 1,
        price: 520000,
      },
      {
        productId: 11,
        productName: "Tinh Chất Retinol 0.5% Trẻ Hóa Da",
        quantity: 2,
        price: 320000,
      },
    ],
    total: 1160000,
    status: "shipping",
    paymentMethod: "bank",
    createdAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "ORD-004",
    customerName: "Phạm Thị D",
    customerEmail: "phamthid@example.com",
    customerPhone: "0934567890",
    address: "321 Võ Văn Tần, Quận 3, TP.HCM",
    items: [
      {
        productId: 8,
        productName: "Phấn Nền Cushion Che Phủ Hoàn Hảo",
        quantity: 1,
        price: 650000,
      },
    ],
    total: 650000,
    status: "delivered",
    paymentMethod: "cod",
    createdAt: "2024-01-10T16:45:00Z",
  },
  {
    id: "ORD-005",
    customerName: "Hoàng Văn E",
    customerEmail: "hoangvane@example.com",
    customerPhone: "0945678901",
    address: "654 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM",
    items: [
      {
        productId: 4,
        productName: "Nước Tẩy Trang Micellar Water",
        quantity: 3,
        price: 345000,
      },
    ],
    total: 1035000,
    status: "cancelled",
    paymentMethod: "momo",
    createdAt: "2024-01-08T11:00:00Z",
  },
  {
    id: "ORD-006",
    customerName: "Đỗ Thị F",
    customerEmail: "dothif@example.com",
    customerPhone: "0956789012",
    address: "987 Cách Mạng Tháng 8, Quận 10, TP.HCM",
    items: [
      {
        productId: 10,
        productName: "Mascara Dày Mi & Cong Tự Nhiên",
        quantity: 2,
        price: 195000,
      },
      {
        productId: 5,
        productName: "Mặt Nạ Đất Sét Kiềm Dầu",
        quantity: 1,
        price: 185000,
      },
    ],
    total: 575000,
    status: "delivered",
    paymentMethod: "bank",
    createdAt: "2024-01-05T08:30:00Z",
  },
];
