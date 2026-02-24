export interface AttributeValue {
  id: string;
  value: string;
  displayValue?: string;
}

export interface Attribute {
  id: string;
  name: string;
  code: string;
  type: "select" | "color" | "size" | "text";
  values: AttributeValue[];
  isActive: boolean;
  createdAt: string;
}

export const mockAttributes: Attribute[] = [
  {
    id: "1",
    name: "Dung tích",
    code: "volume",
    type: "select",
    values: [
      { id: "1-1", value: "30ml" },
      { id: "1-2", value: "50ml" },
      { id: "1-3", value: "100ml" },
      { id: "1-4", value: "150ml" },
      { id: "1-5", value: "200ml" },
    ],
    isActive: true,
    createdAt: "2024-01-10",
  },
  {
    id: "2",
    name: "Màu sắc",
    code: "color",
    type: "color",
    values: [
      { id: "2-1", value: "#FF6B6B", displayValue: "Đỏ san hô" },
      { id: "2-2", value: "#E91E63", displayValue: "Hồng đậm" },
      { id: "2-3", value: "#9C27B0", displayValue: "Tím" },
      { id: "2-4", value: "#795548", displayValue: "Nâu đất" },
      { id: "2-5", value: "#FF5722", displayValue: "Cam cháy" },
    ],
    isActive: true,
    createdAt: "2024-01-12",
  },
  {
    id: "3",
    name: "Loại da",
    code: "skin_type",
    type: "select",
    values: [
      { id: "3-1", value: "Da dầu" },
      { id: "3-2", value: "Da khô" },
      { id: "3-3", value: "Da hỗn hợp" },
      { id: "3-4", value: "Da nhạy cảm" },
      { id: "3-5", value: "Mọi loại da" },
    ],
    isActive: true,
    createdAt: "2024-01-15",
  },
  {
    id: "4",
    name: "Xuất xứ",
    code: "origin",
    type: "select",
    values: [
      { id: "4-1", value: "Hàn Quốc" },
      { id: "4-2", value: "Nhật Bản" },
      { id: "4-3", value: "Pháp" },
      { id: "4-4", value: "Mỹ" },
      { id: "4-5", value: "Việt Nam" },
    ],
    isActive: true,
    createdAt: "2024-01-18",
  },
  {
    id: "5",
    name: "Thành phần chính",
    code: "ingredient",
    type: "text",
    values: [
      { id: "5-1", value: "Vitamin C" },
      { id: "5-2", value: "Retinol" },
      { id: "5-3", value: "Hyaluronic Acid" },
      { id: "5-4", value: "Niacinamide" },
      { id: "5-5", value: "AHA/BHA" },
    ],
    isActive: true,
    createdAt: "2024-01-20",
  },
];
