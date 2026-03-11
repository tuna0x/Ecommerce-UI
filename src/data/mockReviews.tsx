export interface Review {
  id: number;
  productId: number;
  userId: string;
  userName: string;
  avatar?: string;
  rating: number;
  comment: string;
  images?: string[];
  orderId: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  helpful: number;
}

export const mockReviews: Review[] = [
  {
    id: 1,
    productId: 1,
    userId: "user-1",
    userName: "Nguyễn Thị Mai",
    rating: 5,
    comment:
      "Serum rất tốt, da mình sáng lên rõ rệt sau 2 tuần sử dụng. Kết cấu lỏng, thẩm thấu nhanh, không gây nhờn rít. Rất recommend cho ai muốn làm sáng da!",
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&q=80",
    ],
    orderId: "ORD-001",
    isVerifiedPurchase: true,
    createdAt: "2024-01-20T08:30:00Z",
    helpful: 24,
  },
  {
    id: 2,
    productId: 1,
    userId: "user-2",
    userName: "Trần Văn Hùng",
    rating: 4,
    comment:
      "Sản phẩm OK, dùng được 1 tuần thấy da đều màu hơn. Giao hàng nhanh, đóng gói cẩn thận. Trừ 1 sao vì giá hơi cao.",
    orderId: "ORD-010",
    isVerifiedPurchase: true,
    createdAt: "2024-01-18T14:20:00Z",
    helpful: 8,
  },
  {
    id: 3,
    productId: 1,
    userId: "user-3",
    userName: "Lê Thị Hồng",
    rating: 5,
    comment:
      "Mua lần thứ 3 rồi, không bao giờ thất vọng. Da mình thuộc loại dầu nhưng dùng serum này rất thoải mái, không gây mụn.",
    orderId: "ORD-015",
    isVerifiedPurchase: true,
    createdAt: "2024-01-15T10:00:00Z",
    helpful: 15,
  },
  {
    id: 4,
    productId: 2,
    userId: "user-1",
    userName: "Nguyễn Thị Mai",
    rating: 5,
    comment:
      "Kem chống nắng tốt nhất mình từng dùng. Không gây trắng vệt, kiềm dầu tốt, bảo vệ da cả ngày dài.",
    orderId: "ORD-001",
    isVerifiedPurchase: true,
    createdAt: "2024-01-22T09:15:00Z",
    helpful: 32,
  },
  {
    id: 5,
    productId: 2,
    userId: "user-4",
    userName: "Phạm Anh Tuấn",
    rating: 4,
    comment:
      "Dùng tốt, SPF cao, phù hợp với thời tiết nắng nóng. Hơi đắt nhưng chất lượng xứng đáng.",
    orderId: "ORD-020",
    isVerifiedPurchase: true,
    createdAt: "2024-01-19T16:30:00Z",
    helpful: 5,
  },
  {
    id: 6,
    productId: 3,
    userId: "user-5",
    userName: "Võ Thị Lan",
    rating: 5,
    comment:
      "Son lên màu đẹp xuất sắc, lâu trôi cả ngày không cần touch up. Đỏ cherry cực kỳ sang!",
    orderId: "ORD-002",
    isVerifiedPurchase: true,
    createdAt: "2024-01-16T11:45:00Z",
    helpful: 41,
  },
  {
    id: 7,
    productId: 7,
    userId: "user-3",
    userName: "Lê Thị Hồng",
    rating: 5,
    comment:
      "Da khô như mình dùng kem này cứu cánh luôn. Dưỡng ẩm cả ngày, da mềm mịn. Worth every penny!",
    orderId: "ORD-003",
    isVerifiedPurchase: true,
    createdAt: "2024-01-14T07:20:00Z",
    helpful: 18,
  },
  {
    id: 8,
    productId: 8,
    userId: "user-6",
    userName: "Đặng Minh Châu",
    rating: 4,
    comment:
      "Cushion che phủ tốt, finish tự nhiên. Tuy nhiên nếu da dầu thì cần primer trước. Màu hơi sáng hơn thực tế 1 tone.",
    orderId: "ORD-004",
    isVerifiedPurchase: true,
    createdAt: "2024-01-12T13:00:00Z",
    helpful: 12,
  },
  {
    id: 9,
    productId: 4,
    userId: "user-7",
    userName: "Bùi Thanh Hà",
    rating: 5,
    comment:
      "Nước tẩy trang Bioderma quá nổi tiếng rồi, tẩy sạch mà không khô da. Chai 500ml dùng được rất lâu.",
    orderId: "ORD-005",
    isVerifiedPurchase: true,
    createdAt: "2024-01-10T18:00:00Z",
    helpful: 27,
  },
  {
    id: 10,
    productId: 11,
    userId: "user-8",
    userName: "Ngô Quang Vinh",
    rating: 3,
    comment:
      "Retinol hiệu quả nhưng giai đoạn đầu da bị bong tróc khá nhiều. Nên bắt đầu từ 2-3 lần/tuần rồi tăng dần.",
    orderId: "ORD-003",
    isVerifiedPurchase: true,
    createdAt: "2024-01-17T20:30:00Z",
    helpful: 35,
  },
];

// Danh sách productId mà user hiện tại đã mua (mock - giả lập user đã đăng nhập)
export const currentUserPurchasedProducts = [1, 2, 4, 7, 8, 11];
export const currentUserId = "current-user";
export const currentUserName = "Bạn";
