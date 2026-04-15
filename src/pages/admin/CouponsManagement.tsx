import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Copy, Check, Percent, Tag, Loader2, Globe, Lock, X, SearchX } from "lucide-react";
import { cn } from "../../lib/utils";
import { DATE_MIN, DATE_MAX, isValidDate } from "../../lib/date";
import { formatNumberWithDots, parseNumberFromDots } from "../../lib/numberUtils";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    discountValue: 0,
    minOrderValue: 0,
    maxDiscountValue: 0,
    usageLimit: 0,
    startDate: "",
    endDate: "",
    status: "ACTIVE" as CouponStatus,
    isPublic: true,
  });

  const fetchCoupons = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const backendPage = Math.max(page - 1, 0);
      const res = await CouponService.getAll(backendPage, meta.pageSize);
      if (res?.data) {
        setCoupons(res.data.result);
        setMeta(() => ({ ...res.data!.meta, page }));
      }
    } catch {
      toast.error("Không thể tải danh sách mã giảm giá");
    } finally {
      setIsLoading(false);
    }
  }, [meta.pageSize]);

  useEffect(() => {
    fetchCoupons(meta.page);
  }, [fetchCoupons, meta.page]);

  const filteredCoupons = useMemo(() => {
    return coupons.filter(
      (coupon) =>
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [coupons, searchTerm]);

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  const getUsagePercent = (coupon: ICoupon) => {
    if (coupon.usageLimit === 0) return 0;
    return Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100);
  };

  const handleCopyCode = useCallback((code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Đã copy mã coupon");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await CouponService.toggleActive(id, !currentActive);
      toast.success("Đã cập nhật trạng thái");
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, status: !currentActive ? 'ACTIVE' : 'DISABLED' } : c));
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleTogglePublic = async (id: number, currentPublic: boolean) => {
    try {
      await CouponService.togglePublic(id, !currentPublic);
      toast.success("Đã cập nhật trạng thái công khai");
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, isPublic: !currentPublic } : c));
    } catch {
      toast.error("Không thể cập nhật trạng thái công khai");
    }
  };

  const handleOpenDialog = useCallback((coupon?: ICoupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue || 0,
        maxDiscountValue: coupon.maxDiscountValue || 0,
        usageLimit: coupon.usageLimit,
        startDate: coupon.startDate ? coupon.startDate.split("T")[0] : "",
        endDate: coupon.endDate ? coupon.endDate.split("T")[0] : "",
        status: coupon.status,
        isPublic: coupon.isPublic ?? true,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        name: "",
        description: "",
        type: "PERCENT",
        discountValue: 0,
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
  }, []);

  const generateCode = useCallback(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  }, []);

  const handleSave = useCallback(async () => {
    if (
      !formData.name ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (!isValidDate(formData.startDate) || !isValidDate(formData.endDate)) {
      toast.error(`Ngày phải trong khoảng từ năm 2000 đến 2100`);
      return;
    }

    try {
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [editingCoupon, formData, fetchCoupons, meta.page]);

  const handleDelete = useCallback(async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) {
      try {
        await CouponService.delete(id);
        toast.success("Đã xóa mã giảm giá");
        fetchCoupons(meta.page);
      } catch {
        toast.error("Không thể xóa mã giảm giá");
      }
    }
  }, [fetchCoupons, meta.page]);

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
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Tìm kiếm mã giảm giá..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center -top-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <div className="border rounded-lg bg-card overflow-hidden">
          <Table>
          <TableHeader>
              <TableRow>
                <TableHead>Mã coupon</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Sử dụng</TableHead>
                <TableHead className="text-center">Công khai</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 px-4">
                    <div className="flex flex-col items-center justify-center max-w-[200px] mx-auto text-muted-foreground">
                      <div className="relative mb-4">
                         <SearchX className="w-12 h-12 opacity-20" />
                         <Tag className="w-6 h-6 absolute -bottom-1 -right-1 text-primary animate-bounce shadow-xl" />
                      </div>
                      <p className="font-semibold text-foreground">Không tìm thấy kết quả</p>
                      <p className="text-xs mt-1 text-center font-normal italic">Vui lòng thử lại với từ khóa khác hoặc tạo mới</p>
                      {searchTerm && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={() => setSearchTerm("")}
                          className="mt-2 text-primary h-auto p-0"
                        >
                          Xóa tìm kiếm
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCoupons.map((coupon) => {
                  const expired = isExpired(coupon.endDate);
                  const TypeIcon = getTypeIcon(coupon.type);
                  return (
                    <TableRow key={coupon.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded font-mono text-sm font-bold">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 transition-colors"
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
                          <div className="text-sm text-muted-foreground line-clamp-1 opacity-70">
                            {coupon.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        <div className="flex items-center gap-1">
                          <TypeIcon className="h-3 w-3" />
                          {coupon.type === "PERCENT"
                            ? `${coupon.discountValue}%`
                            : `${(coupon.discountValue || 0).toLocaleString()}đ`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm leading-relaxed">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground w-6">Từ:</span>
                            <span>{coupon.startDate ? coupon.startDate.split("T")[0] : ""}</span>
                          </div>
                          <div className={cn("flex items-center gap-1", expired ? "text-destructive font-medium" : "")}>
                            <span className="text-muted-foreground w-6">Đến:</span>
                            <span>{coupon.endDate ? coupon.endDate.split("T")[0] : ""}</span>
                            {expired && <span className="text-[10px] uppercase font-bold">(Hết)</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 w-24">
                          <div className="text-sm flex justify-between">
                            <span>{coupon.usedCount}</span>
                            <span className="text-muted-foreground">/ {coupon.usageLimit || "∞"}</span>
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
                        <div className="flex justify-center">
                           <div className="flex items-center gap-2">
                            {coupon.isPublic ? <Globe className="w-3.5 h-3.5 text-blue-500" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                            <Switch
                              checked={coupon.isPublic}
                              onCheckedChange={() => handleTogglePublic(coupon.id, coupon.isPublic)}
                              className="data-[state=checked]:bg-blue-500 scale-90"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex justify-center">
                          <Switch
                            checked={coupon.status === "ACTIVE"}
                            onCheckedChange={() => handleToggleActive(coupon.id, coupon.status === "ACTIVE")}
                            className="data-[state=checked]:bg-green-500 scale-90"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleOpenDialog(coupon)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <PaginationControl
            currentPage={meta.page}
            totalPages={meta.pages}
            onPageChange={(page) => setMeta((p) => ({ ...p, page }))}
          />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Sửa mã giảm giá" : "Thêm mã giảm giá mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4 pr-6">
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
                  type="text"
                  value={formatNumberWithDots(formData.discountValue)}
                  onChange={(e) =>
                    setFormData({ ...formData, discountValue: parseNumberFromDots(e.target.value) })
                  }
                  className="font-bold"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Đơn tối thiểu</Label>
                <Input
                  type="text"
                  value={formatNumberWithDots(formData.minOrderValue)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOrderValue: parseNumberFromDots(e.target.value),
                    })
                  }
                  className="font-bold"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Giảm tối đa</Label>
                <Input
                  type="text"
                  value={formatNumberWithDots(formData.maxDiscountValue)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscountValue: parseNumberFromDots(e.target.value),
                    })
                  }
                  className="font-bold"
                  placeholder="Không giới hạn"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tổng lượt dùng</Label>
                <Input
                  type="text"
                  value={formatNumberWithDots(formData.usageLimit)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usageLimit: parseNumberFromDots(e.target.value),
                    })
                  }
                  className="font-bold"
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
                    className="data-[state=checked]:bg-blue-500"
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
                  min={DATE_MIN}
                  max={DATE_MAX}
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
                  min={DATE_MIN}
                  max={DATE_MAX}
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
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCoupon ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsManagement;
