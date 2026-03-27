import React, { useState, useRef, useEffect, useCallback } from "react";
import PaginationControl from "../../components/PaginationControl";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Upload,
  ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { BannerService } from "../../service/bannerService";
import type { IBanner, ICreateBanner, IUpdateBanner } from "../../types/banner.type";
import { Skeleton } from "../../components/ui/skeleton";

const positionLabels: Record<IBanner["position"], string> = {
  hero: "Banner chính (Hero)",
  sub: "Banner phụ",
  popup: "Popup",
  category: "Banner danh mục",
};

const BannersManagement: React.FC = () => {
  const [bannerList, setBannerList] = useState<IBanner[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<IBanner | null>(null);
  const [formData, setFormData] = useState<ICreateBanner>({
    title: "",
    link: "",
    position: "hero",
    order: 1,
    isActive: true,
    startDate: "",
    endDate: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [files, setFiles] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await BannerService.getAll(
        currentPage - 1,
        pageSize,
        debouncedSearch,
        "createdAt,desc"
      );
      if (!res.error) {
        setBannerList(res.data?.result || []);
        setTotalPages(res.data?.meta.pages || 0);
      }
    } catch {
      toast.error("Không thể tải danh sách banner");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa 5MB");
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setFiles(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openAddDialog = () => {
    setEditingBanner(null);
    setFormData({
      title: "",
      link: "",
      position: "hero",
      order: 1,
      isActive: true,
      startDate: "",
      endDate: "",
    });
    setImagePreview(null);
    setFiles(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (banner: IBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      link: banner.link || "",
      position: banner.position,
      order: banner.order,
      isActive: banner.isActive,
      startDate: banner.startDate || "",
      endDate: banner.endDate || "",
    });
    setImagePreview(banner.image);
    setFiles(null);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề banner");
      return;
    }
    if (!imagePreview && !editingBanner) {
      toast.error("Vui lòng tải ảnh banner");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingBanner) {
        const updateData: IUpdateBanner = {
          ...formData,
          id: editingBanner.id,
        };
        await BannerService.update(updateData, files || undefined);
        toast.success("Cập nhật banner thành công");
      } else {
        await BannerService.create(formData, files || undefined);
        toast.success("Thêm banner thành công");
      }
      setIsDialogOpen(false);
      fetchBanners();
    } catch {
      toast.error("Đã xảy ra lỗi khi lưu banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa banner này?")) {
      try {
        await BannerService.remove(id);
        toast.success("Xóa banner thành công");
        fetchBanners();
      } catch {
        toast.error("Không thể xóa banner");
      }
    }
  };

  const toggleActive = async (banner: IBanner) => {
    try {
      if (!banner.id) return;
      await BannerService.toggleActive(banner.id, !banner.isActive);
      toast.success(`Banner ${!banner.isActive ? "đã kích hoạt" : "đã tạm dừng"}`);
      fetchBanners();
    } catch (error) {
      console.error("Lỗi toggle status:", error);
      toast.error("Không thể thay đổi trạng thái banner");
    }
  };

  const isExpired = (endDate: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý banner</h1>
          <p className="text-muted-foreground">
            Quản lý hình ảnh quảng cáo trên website
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm banner
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm banner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách banner ({bannerList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Ảnh</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Tiêu đề</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Vị trí</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Thứ tự</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Thời gian</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Trạng thái</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-2"><Skeleton className="w-24 h-14 rounded-lg" /></td>
                      <td className="py-4 px-2"><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-24" /></td>
                      <td className="py-4 px-2 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                      <td className="py-4 px-2 text-center text-sm font-medium"><Skeleton className="h-4 w-6 mx-auto" /></td>
                      <td className="py-3 px-2"><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-4 w-24" /></td>
                      <td className="py-3 px-2 text-center"><Skeleton className="h-5 w-10 mx-auto rounded-full" /></td>
                      <td className="py-3 px-2"><div className="flex items-center justify-end gap-1"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></td>
                    </tr>
                  ))
                ) : bannerList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground italic">Không tìm thấy banner nào</td>
                  </tr>
                ) : (
                  bannerList.map((banner) => (
                    <tr key={banner.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2">
                        <div className="relative group/img overflow-hidden rounded-lg w-24 h-14 border border-border">
                          <img src={banner.image || "/no-image.png"} alt={banner.title} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" />
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm font-semibold">{banner.title}</div>
                        {banner.link && <div className="text-xs text-muted-foreground truncate max-w-[150px] opacity-70">{banner.link}</div>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wider">{positionLabels[banner.position]}</Badge>
                      </td>
                      <td className="py-3 px-2 text-center text-sm font-medium">{banner.order}</td>
                      <td className="py-3 px-2">
                        <div className="text-[11px] leading-relaxed">
                          {banner.startDate && <div className="flex items-center gap-1"><span className="text-muted-foreground">Từ:</span><span>{banner.startDate}</span></div>}
                          {banner.endDate && (
                            <div className={cn("flex items-center gap-1", isExpired(banner.endDate) ? "text-destructive font-medium" : "")}>
                              <span className="text-muted-foreground">Đến:</span><span>{banner.endDate}</span>
                              {isExpired(banner.endDate) && <span className="text-[10px] uppercase">(Hết hạn)</span>}
                            </div>
                          )}
                          {!banner.startDate && !banner.endDate && <span className="text-muted-foreground italic">Không giới hạn</span>}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Switch checked={banner.isActive} onCheckedChange={() => toggleActive(banner)} />
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => openEditDialog(banner)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => handleDelete(banner.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <PaginationControl currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !isSubmitting && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Sửa banner" : "Thêm banner mới"}</DialogTitle>
            <DialogDescription>
              {editingBanner ? "Cập nhật thông tin chi tiết cho banner quảng cáo này" : "Tạo banner mới để hiển thị trên trang chủ"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tiêu đề banner</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Nhập tiêu đề banner" />
            </div>
            <div className="grid gap-2">
              <Label>Liên kết (URL)</Label>
              <Input value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="/flash-sale hoặc https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Vị trí hiển thị</Label>
                <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v as IBanner["position"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Banner chính (Hero)</SelectItem>
                    <SelectItem value="sub">Banner phụ</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                    <SelectItem value="category">Banner danh mục</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Thứ tự</Label>
                <Input type="number" min="1" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Ngày bắt đầu</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Ngày kết thúc</Label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Hình ảnh banner</Label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {imagePreview ? (
                <div className="relative w-full aspect-[21/9] rounded-lg border border-border overflow-hidden group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-1" />Đổi ảnh</Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => setImagePreview(null)}><X className="h-4 w-4" /></Button>
                  </div>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-[21/9] rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-sm font-medium">Nhấn để tải ảnh banner</span>
                  <span className="text-xs">Tỷ lệ khuyến nghị 21:9 (tối đa 5MB)</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Hủy</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                editingBanner ? "Cập nhật" : "Thêm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannersManagement;
