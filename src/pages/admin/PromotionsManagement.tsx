import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Percent,
  Truck,
  Gift,
  Tag,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { mockPromotions } from "../../data/mockPromotions";
import type { Promotion } from "../../data/mockPromotions";
import { toast } from "sonner";

const PromotionsManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "percentage" as Promotion["type"],
    value: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    startDate: "",
    endDate: "",
    isActive: true,
    applicableProducts: "all" as Promotion["applicableProducts"],
  });

  const filteredPromotions = promotions.filter(
    (promo) =>
      promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getTypeIcon = (type: Promotion["type"]) => {
    const icons = {
      percentage: Percent,
      fixed: Tag,
      buy_x_get_y: Gift,
      free_shipping: Truck,
    };
    return icons[type];
  };

  const getTypeLabel = (type: Promotion["type"]) => {
    const labels = {
      percentage: "Giảm %",
      fixed: "Giảm tiền",
      buy_x_get_y: "Mua X tặng Y",
      free_shipping: "Freeship",
    };
    return labels[type];
  };

  const formatValue = (promo: Promotion) => {
    switch (promo.type) {
      case "percentage":
        return `${promo.value}%`;
      case "fixed":
        return `${promo.value.toLocaleString()}đ`;
      case "buy_x_get_y":
        return `Tặng ${promo.value}`;
      case "free_shipping":
        return "Miễn phí";
      default:
        return promo.value;
    }
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  const handleOpenDialog = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        value: promotion.value,
        minOrderValue: promotion.minOrderValue || 0,
        maxDiscount: promotion.maxDiscount || 0,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isActive: promotion.isActive,
        applicableProducts: promotion.applicableProducts,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        name: "",
        description: "",
        type: "percentage",
        value: 0,
        minOrderValue: 0,
        maxDiscount: 0,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        isActive: true,
        applicableProducts: "all",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (editingPromotion) {
      setPromotions(
        promotions.map((promo) =>
          promo.id === editingPromotion.id
            ? {
                ...promo,
                ...formData,
                minOrderValue: formData.minOrderValue || undefined,
                maxDiscount: formData.maxDiscount || undefined,
              }
            : promo,
        ),
      );
      toast.success("Đã cập nhật khuyến mãi");
    } else {
      const newPromotion: Promotion = {
        id: Date.now().toString(),
        ...formData,
        minOrderValue: formData.minOrderValue || undefined,
        maxDiscount: formData.maxDiscount || undefined,
        usageCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setPromotions([...promotions, newPromotion]);
      toast.success("Đã thêm khuyến mãi mới");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setPromotions(promotions.filter((promo) => promo.id !== id));
    toast.success("Đã xóa khuyến mãi");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Khuyến mãi</h1>
          <p className="text-muted-foreground">
            Quản lý các chương trình khuyến mãi
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm khuyến mãi
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm khuyến mãi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên khuyến mãi</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Đã dùng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPromotions.map((promotion) => {
              const TypeIcon = getTypeIcon(promotion.type);
              const expired = isExpired(promotion.endDate);
              return (
                <TableRow key={promotion.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{promotion.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {promotion.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <TypeIcon className="h-3 w-3" />
                      {getTypeLabel(promotion.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {formatValue(promotion)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{promotion.startDate}</div>
                      <div className="text-muted-foreground">
                        → {promotion.endDate}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{promotion.usageCount} lần</TableCell>
                  <TableCell>
                    {expired ? (
                      <Badge variant="destructive">Hết hạn</Badge>
                    ) : (
                      <Badge
                        variant={promotion.isActive ? "default" : "secondary"}
                      >
                        {promotion.isActive ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(promotion)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(promotion.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? "Sửa khuyến mãi" : "Thêm khuyến mãi mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Tên khuyến mãi *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="VD: Flash Sale Mùa Hè"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả chi tiết khuyến mãi"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại khuyến mãi</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Promotion["type"]) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Giảm theo %</SelectItem>
                    <SelectItem value="fixed">Giảm tiền cố định</SelectItem>
                    <SelectItem value="buy_x_get_y">Mua X tặng Y</SelectItem>
                    <SelectItem value="free_shipping">
                      Miễn phí vận chuyển
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  {formData.type === "percentage"
                    ? "Phần trăm giảm"
                    : formData.type === "fixed"
                      ? "Số tiền giảm"
                      : formData.type === "buy_x_get_y"
                        ? "Số lượng tặng"
                        : "Giá trị"}
                </Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: Number(e.target.value) })
                  }
                  disabled={formData.type === "free_shipping"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Đơn tối thiểu</Label>
                <Input
                  type="number"
                  value={formData.minOrderValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOrderValue: Number(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Giảm tối đa</Label>
                <Input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscount: Number(e.target.value),
                    })
                  }
                  placeholder="Không giới hạn"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày bắt đầu *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Áp dụng cho</Label>
              <Select
                value={formData.applicableProducts}
                onValueChange={(value: Promotion["applicableProducts"]) =>
                  setFormData({ ...formData, applicableProducts: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả sản phẩm</SelectItem>
                  <SelectItem value="category">Theo danh mục</SelectItem>
                  <SelectItem value="specific">Sản phẩm cụ thể</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Trạng thái hoạt động</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editingPromotion ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionsManagement;
