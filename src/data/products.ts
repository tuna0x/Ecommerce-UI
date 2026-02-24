export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  hoverImage: string;
  rating: number;
  reviewCount: number;
  category: string;
  skinType?: string[];
  concern?: string[];
  volume?: string;
  isFlashSale?: boolean;
  stock?: number;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Serum Vitamin C 15% Làm Sáng Da",
    brand: "L'Oreal Paris",
    price: 459000,
    originalPrice: 650000,
    discount: 29,
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&q=80",
    rating: 4.8,
    reviewCount: 256,
    category: "Chăm sóc da",
    skinType: ["Da thường", "Da dầu"],
    concern: ["Làm sáng", "Chống lão hóa"],
    volume: "30ml",
    isFlashSale: true,
    stock: 15,
  },
  {
    id: 2,
    name: "Kem Chống Nắng SPF50+ PA++++",
    brand: "La Roche-Posay",
    price: 425000,
    originalPrice: 550000,
    discount: 23,
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600&q=80",
    rating: 4.9,
    reviewCount: 512,
    category: "Chăm sóc da",
    skinType: ["Mọi loại da"],
    concern: ["Chống nắng", "Dưỡng ẩm"],
    volume: "50ml",
    isFlashSale: true,
    stock: 8,
  },
  {
    id: 3,
    name: "Son Kem Lì Màu Đỏ Cherry",
    brand: "MAC",
    price: 520000,
    originalPrice: 680000,
    discount: 24,
    image:
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=600&q=80",
    rating: 4.7,
    reviewCount: 189,
    category: "Trang điểm",
    concern: ["Lâu trôi", "Mềm mịn"],
    isFlashSale: true,
    stock: 22,
  },
  {
    id: 4,
    name: "Nước Tẩy Trang Micellar Water",
    brand: "Bioderma",
    price: 345000,
    originalPrice: 450000,
    discount: 23,
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80",
    rating: 4.8,
    reviewCount: 423,
    category: "Chăm sóc da",
    skinType: ["Da nhạy cảm", "Mọi loại da"],
    concern: ["Làm sạch", "Dịu nhẹ"],
    volume: "500ml",
  },
  {
    id: 5,
    name: "Mặt Nạ Đất Sét Kiềm Dầu",
    brand: "Innisfree",
    price: 185000,
    originalPrice: 250000,
    discount: 26,
    image:
      "https://images.unsplash.com/photo-1567721913486-6585f069b332?w=600&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&q=80",
    rating: 4.6,
    reviewCount: 178,
    category: "Chăm sóc da",
    skinType: ["Da dầu", "Da hỗn hợp"],
    concern: ["Kiềm dầu", "Se khít lỗ chân lông"],
    volume: "100ml",
  },
  {
    id: 6,
    name: "Dầu Gội Phục Hồi Tóc Hư Tổn",
    brand: "L'Oreal Professionnel",
    price: 380000,
    originalPrice: 480000,
    discount: 21,
    image:
      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1522338242042-2d1c40f16d34?w=600&q=80",
    rating: 4.5,
    reviewCount: 234,
    category: "Chăm sóc tóc",
    concern: ["Phục hồi", "Nuôi dưỡng"],
    volume: "300ml",
  },
  {
    id: 7,
    name: "Kem Dưỡng Ẩm Cấp Nước 72H",
    brand: "Vichy",
    price: 520000,
    originalPrice: 720000,
    discount: 28,
    image:
      "https://images.unsplash.com/photo-1570194065650-d99fb4d8a609?w=600&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1556228841-a3d7ddc4ae36?w=600&q=80",
    rating: 4.7,
    reviewCount: 312,
    category: "Chăm sóc da",
    skinType: ["Da khô", "Da thường"],
    concern: ["Dưỡng ẩm", "Cấp nước"],
    volume: "50ml",
    isFlashSale: true,
    stock: 5,
  },
  {
    id: 8,
    name: "Phấn Nền Cushion Che Phủ Hoàn Hảo",
    brand: "Laneige",
    price: 650000,
    originalPrice: 850000,
    discount: 24,
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1503236823255-94609f598e71?w=600&q=80",
    rating: 4.8,
    reviewCount: 445,
    category: "Trang điểm",
    skinType: ["Mọi loại da"],
    concern: ["Che phủ", "Kiềm dầu"],
  },
  {
    id: 9,
    name: "Toner Cân Bằng Da AHA/BHA",
    brand: "COSRX",
    price: 285000,
    originalPrice: 380000,
    discount: 25,
    image:
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1608571423539-aee55e5e7737?w=600&q=80",
    rating: 4.6,
    reviewCount: 567,
    category: "Chăm sóc da",
    skinType: ["Da dầu", "Da mụn"],
    concern: ["Tẩy tế bào chết", "Kiểm soát mụn"],
    volume: "150ml",
  },
  {
    id: 10,
    name: "Mascara Dày Mi & Cong Tự Nhiên",
    brand: "Maybelline",
    price: 195000,
    originalPrice: 280000,
    discount: 30,
    image:
      "https://images.unsplash.com/photo-1631214540553-ff044a3ff1d4?w=600&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=600&q=80",
    rating: 4.4,
    reviewCount: 289,
    category: "Trang điểm",
    concern: ["Dày mi", "Không lem"],
    isFlashSale: true,
    stock: 30,
  },
  {
    id: 11,
    name: "Tinh Chất Retinol 0.5% Trẻ Hóa Da",
    brand: "The Ordinary",
    price: 320000,
    originalPrice: 420000,
    discount: 24,
    image:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1611930021592-a8cfd5319ceb?w=600&q=80",
    rating: 4.7,
    reviewCount: 678,
    category: "Chăm sóc da",
    skinType: ["Da thường", "Da lão hóa"],
    concern: ["Chống lão hóa", "Làm mờ nếp nhăn"],
    volume: "30ml",
  },
  {
    id: 12,
    name: "Nước Hoa Hồng Dưỡng Ẩm Sâu",
    brand: "Kiehl's",
    price: 580000,
    originalPrice: 750000,
    discount: 23,
    image:
      "https://images.unsplash.com/photo-1601049676869-702ea24cfd58?w=600&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
    rating: 4.8,
    reviewCount: 234,
    category: "Chăm sóc da",
    skinType: ["Da khô", "Da nhạy cảm"],
    concern: ["Dưỡng ẩm", "Làm dịu"],
    volume: "250ml",
  },
];

export const brands = [
  {
    id: 1,
    name: "L'Oreal Paris",
    logo: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=200&q=80",
  },
  {
    id: 2,
    name: "La Roche-Posay",
    logo: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=200&q=80",
  },
  {
    id: 3,
    name: "MAC",
    logo: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=200&q=80",
  },
  {
    id: 4,
    name: "Bioderma",
    logo: "https://images.unsplash.com/photo-629198688000-71f23e745b6e?w=200&q=80",
  },
  {
    id: 5,
    name: "Innisfree",
    logo: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=200&q=80",
  },
  {
    id: 6,
    name: "Vichy",
    logo: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=200&q=80",
  },
  {
    id: 7,
    name: "Laneige",
    logo: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=200&q=80",
  },
  {
    id: 8,
    name: "COSRX",
    logo: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=200&q=80",
  },
];

export const categories = [
  {
    id: 1,
    name: "Chăm sóc da",
    subcategories: [
      "Sữa rửa mặt",
      "Toner",
      "Serum",
      "Kem dưỡng",
      "Mặt nạ",
      "Kem chống nắng",
    ],
  },
  {
    id: 2,
    name: "Trang điểm",
    subcategories: [
      "Son môi",
      "Phấn nền",
      "Mascara",
      "Kẻ mắt",
      "Phấn má",
      "Highlighter",
    ],
  },
  {
    id: 3,
    name: "Chăm sóc tóc",
    subcategories: ["Dầu gội", "Dầu xả", "Ủ tóc", "Dưỡng tóc", "Tạo kiểu"],
  },
  {
    id: 4,
    name: "Chăm sóc cơ thể",
    subcategories: ["Sữa tắm", "Dưỡng thể", "Lăn khử mùi", "Nước hoa"],
  },
  {
    id: 5,
    name: "Thực phẩm chức năng",
    subcategories: ["Vitamin", "Collagen", "Giảm cân", "Làm đẹp da"],
  },
];
