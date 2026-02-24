import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search, Copy, Check } from "lucide-react";
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
import { Progress } from "../../components/ui/progress";
import { mockCoupons } from "../../data/mockCoupons";
import type { Coupon } from "../../data/mockCoupons";
import { toast } from "sonner";

const CouponsManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "percentage" as Coupon["type"],
    value: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: 0,
    perUserLimit: 1,
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isExpired = (endDate: string) => new Date(endDate) < new Date();
  const isExhausted = (coupon: Coupon) =>
    coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;

  const getUsagePercent = (coupon: Coupon) => {
    if (coupon.usageLimit === 0) return 0;
    return Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Đã copy mã coupon");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minOrderValue: coupon.minOrderValue || 0,
        maxDiscount: coupon.maxDiscount || 0,
        usageLimit: coupon.usageLimit,
        perUserLimit: coupon.perUserLimit,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        isActive: coupon.isActive,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        name: "",
        description: "",
        type: "percentage",
        value: 0,
        minOrderValue: 0,
        maxDiscount: 0,
        usageLimit: 0,
        perUserLimit: 1,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSave = () => {
    if (
      !formData.code ||
      !formData.name ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Check if code exists (for new coupons)
    if (!editingCoupon && coupons.some((c) => c.code === formData.code)) {
      toast.error("Mã coupon đã tồn tại");
      return;
    }

    if (editingCoupon) {
      setCoupons(
        coupons.map((coupon) =>
          coupon.id === editingCoupon.id
            ? {
                ...coupon,
                ...formData,
                minOrderValue: formData.minOrderValue || undefined,
                maxDiscount: formData.maxDiscount || undefined,
              }
            : coupon,
        ),
      );
      toast.success("Đã cập nhật mã giảm giá");
    } else {
      const newCoupon: Coupon = {
        id: Date.now().toString(),
        ...formData,
        minOrderValue: formData.minOrderValue || undefined,
        maxDiscount: formData.maxDiscount || undefined,
        usedCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setCoupons([...coupons, newCoupon]);
      toast.success("Đã thêm mã giảm giá mới");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setCoupons(coupons.filter((coupon) => coupon.id !== id));
    toast.success("Đã xóa mã giảm giá");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Mã giảm giá</h1>
          <p className="text-muted-foreground">Quản lý các mã coupon</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm mã giảm giá
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm mã giảm giá..."
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
              <TableHead>Mã coupon</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Sử dụng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCoupons.map((coupon) => {
              const expired = isExpired(coupon.endDate);
              const exhausted = isExhausted(coupon);
              return (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded font-mono text-sm font-bold">
                        {coupon.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyCode(coupon.code, coupon.id)}
                      >
                        {copiedId === coupon.id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{coupon.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {coupon.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {coupon.type === "percentage"
                      ? `${coupon.value}%`
                      : `${coupon.value.toLocaleString()}đ`}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{coupon.startDate}</div>
                      <div className="text-muted-foreground">
                        → {coupon.endDate}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 w-24">
                      <div className="text-sm">
                        {coupon.usedCount}/{coupon.usageLimit || "∞"}
                      </div>
                      {coupon.usageLimit > 0 && (
                        <Progress
                          value={getUsagePercent(coupon)}
                          className="h-1.5"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {expired ? (
                      <Badge variant="destructive">Hết hạn</Badge>
                    ) : exhausted ? (
                      <Badge variant="secondary">Đã hết</Badge>
                    ) : (
                      <Badge
                        variant={coupon.isActive ? "default" : "secondary"}
                      >
                        {coupon.isActive ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(coupon)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coupon.id)}
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
              {editingCoupon ? "Sửa mã giảm giá" : "Thêm mã giảm giá mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Mã coupon *</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="VD: SUMMER50"
                  className="font-mono uppercase"
                />
                <Button type="button" variant="outline" onClick={generateCode}>
                  Tạo mã
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tên mã giảm giá *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="VD: Mã giảm giá mùa hè"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả chi tiết mã giảm giá"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại giảm giá</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Coupon["type"]) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Giảm theo %</SelectItem>
                    <SelectItem value="fixed">Giảm tiền cố định</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  {formData.type === "percentage"
                    ? "Phần trăm giảm"
                    : "Số tiền giảm"}
                </Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: Number(e.target.value) })
                  }
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
                <Label>Tổng lượt dùng</Label>
                <Input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usageLimit: Number(e.target.value),
                    })
                  }
                  placeholder="0 = Không giới hạn"
                />
              </div>
              <div className="space-y-2">
                <Label>Lượt/người</Label>
                <Input
                  type="number"
                  value={formData.perUserLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      perUserLimit: Number(e.target.value),
                    })
                  }
                  min={1}
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
              {editingCoupon ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsManagement;
