import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search, Copy, Check, Percent, Tag } from "lucide-react";
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
import { toast } from "sonner";
import { CouponService } from "../../service/couponService";
import type { ICoupon, CouponType, CouponStatus } from "../../types/coupon.type";
import type { IMeta } from "../../types/api.type";
import PaginationControl from "../../components/PaginationControl";

const CouponsManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<ICoupon | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [meta, setMeta] = useState<IMeta>({
    page: 1,
    pageSize: 10,
    pages: 0,
    total: 0,
  });

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "PERCENT" as CouponType,
    value: 0,
    minOrderValue: 0,
    maxDiscountValue: 0,
    usageLimit: 0,
    startDate: "",
    endDate: "",
    status: "ACTIVE" as CouponStatus,
    isPublic: true,
  });

  const fetchCoupons = async (page = 1) => {
    try {
      // Backend expects 0‑based page index, frontend uses 1‑based.
      const backendPage = Math.max(page - 1, 0);
      const res = await CouponService.getAll(backendPage, meta.pageSize);
      if (res?.data) {
        setCoupons(res.data.result);
        // Preserve the frontend page number while updating other meta fields.
        setMeta({ ...res.data.meta, page });
      }
    } catch {
      toast.error("Không thể tải danh sách mã giảm giá");
    }
  };

  React.useEffect(() => {
    fetchCoupons(meta.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.page]);

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isExpired = (endDate: string) => new Date(endDate) < new Date();
  const isExhausted = (coupon: ICoupon) =>
    coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;

  const getUsagePercent = (coupon: ICoupon) => {
    if (coupon.usageLimit === 0) return 0;
    return Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100);
  };

  const handleCopyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Đã copy mã coupon");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenDialog = (coupon?: ICoupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minOrderValue: coupon.minOrderValue || 0,
        maxDiscountValue: coupon.maxDiscountValue || 0,
        usageLimit: coupon.usageLimit,
        startDate: coupon.startDate ? coupon.startDate.split("T")[0] : "",
        endDate: coupon.endDate ? coupon.endDate.split("T")[0] : "",
        status: coupon.status,
        isPublic: coupon.isPublic,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        name: "",
        description: "",
        type: "PERCENT",
        value: 0,
        minOrderValue: 0,
        maxDiscountValue: 0,
        usageLimit: 0,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        status: "ACTIVE",
        isPublic: true,
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

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      if (editingCoupon) {
        await CouponService.update({
          ...formData,
          id: editingCoupon.id,
        });
        toast.success("Đã cập nhật mã giảm giá");
      } else {
        await CouponService.create(formData);
        toast.success("Đã thêm mã giảm giá mới");
      }
      setIsDialogOpen(false);
      fetchCoupons(meta.page);
    } catch {
      toast.error("Có lỗi xảy ra khi lưu mã giảm giá");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await CouponService.delete(id);
      toast.success("Đã xóa mã giảm giá");
      fetchCoupons(meta.page);
    } catch {
      toast.error("Không thể xóa mã giảm giá");
    }
  };

  const getTypeIcon = (type: CouponType) => {
    return type === "PERCENT" ? Percent : Tag;
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
              const TypeIcon = getTypeIcon(coupon.type);
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
                    <div className="flex items-center gap-1">
                      <TypeIcon className="h-3 w-3" />
                      {coupon.type === "PERCENT"
                        ? `${coupon.value}%`
                        : `${coupon.value.toLocaleString()}đ`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{coupon.startDate ? coupon.startDate.split("T")[0] : ""}</div>
                      <div className="text-muted-foreground">
                        → {coupon.endDate ? coupon.endDate.split("T")[0] : ""}
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
                        variant={coupon.status === "ACTIVE" ? "default" : "secondary"}
                      >
                        {coupon.status === "ACTIVE" ? "Hoạt động" : "Tạm dừng"}
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
        <PaginationControl
          currentPage={meta.page}
          totalPages={meta.pages}
          onPageChange={(page) => setMeta({ ...meta, page })}
        />
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
                  onValueChange={(value: CouponType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Giảm theo %</SelectItem>
                    <SelectItem value="FIXED">Giảm tiền cố định</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  {formData.type === "PERCENT"
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
                  value={formData.maxDiscountValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscountValue: Number(e.target.value),
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
                <Label>Công khai</Label>
                <div className="flex items-center h-10">
                   <Switch
                    checked={formData.isPublic}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPublic: checked })
                    }
                  />
                </div>
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
                checked={formData.status === "ACTIVE"}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, status: checked ? "ACTIVE" : "DISABLED" })
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
