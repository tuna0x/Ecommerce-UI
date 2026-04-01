import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Search, Pencil, Trash2, ImageIcon, Upload, X, Loader2, Calendar, ExternalLink } from "lucide-react";
import { BannerService } from "../../service/bannerService";
import type { IBanner, ICreateBanner, IUpdateBanner } from "../../types/banner.type";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import PaginationControl from "../../components/PaginationControl";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const BannersManagement: React.FC = () => {
  const [bannerList, setBannerList] = useState<IBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(8);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBanner, setEditingBanner] = useState<IBanner | null>(null);

  const [formData, setFormData] = useState<ICreateBanner>({
    title: "",
    subtitle: "",
    description: "",
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
        "createdAt,desc",
      );
      if (!res.error) {
        console.log("=== API Banner Resp:", res.data?.result);
        const allBanners = res.data?.result || [];
        setBannerList(allBanners);
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

  const openAddDialog = useCallback(() => {
    setEditingBanner(null);
    setFormData({
      title: "",
      subtitle: "",
      description: "",
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
  }, []);

  const openEditDialog = useCallback((banner: IBanner) => {
    console.log("=== Opening Edit for Banner:", banner);
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      link: banner.link || "",
      position: banner.position || "hero",
      order: banner.order || 1,
      isActive: banner.isActive,
      startDate: banner.startDate || "",
      endDate: banner.endDate || "",
    });
    setImagePreview(banner.image);
    setFiles(null);
    setIsDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề banner");
      return;
    }
    if (!imagePreview && !editingBanner) {
      toast.error("Vui lòng tải ảnh banner");
      return;
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("=== Saving Data:", formData);
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
    } catch (err) {
      console.error("Save Error:", err);
      toast.error("Đã xảy ra lỗi khi lưu banner");
    } finally {
      setIsSubmitting(false);
    }
  }, [editingBanner, formData, files, fetchBanners, imagePreview]);

  const handleDelete = useCallback(async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa banner này?")) {
      try {
        await BannerService.remove(id);
        toast.success("Xóa banner thành công");
        fetchBanners();
      } catch {
        toast.error("Không thể xóa banner");
      }
    }
  }, [fetchBanners]);

  const toggleActive = useCallback(async (banner: IBanner) => {
    try {
      if (!banner.id) return;
      await BannerService.toggleActive(banner.id, !banner.isActive);
      toast.success(`Banner ${!banner.isActive ? "đã kích hoạt" : "đã tạm dừng"}`);
      fetchBanners();
    } catch (error) {
      console.error("Lỗi toggle status:", error);
      toast.error("Không thể thay đổi trạng thái banner");
    }
  }, [fetchBanners]);

  const isExpired = (endDate?: string) => {
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
          <CardTitle>Danh sách Banner ({bannerList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("relative transition-opacity duration-300", isLoading ? "opacity-50" : "opacity-100")}>
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-4 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Ảnh</th>
                    <th className="py-4 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Thông tin banner</th>
                    <th className="py-4 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Vị trí</th>
                    <th className="py-4 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Thời hạn</th>
                    <th className="py-4 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Trạng thái</th>
                    <th className="py-4 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bannerList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        Không tìm thấy banner nào. Hãy thêm mới!
                      </td>
                    </tr>
                  ) : (
                    bannerList.map((banner) => (
                      <tr key={banner.id} className="group hover:bg-muted/40 transition-all duration-200">
                        <td className="py-5 px-4">
                          <div className="w-36 aspect-[21/9] rounded-lg border border-border overflow-hidden bg-muted shadow-sm group-hover:shadow transition-shadow">
                            <img src={banner.image} alt={banner.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          </div>
                        </td>
                        <td className="py-5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">{banner.title}</span>
                            {banner.subtitle && <span className="text-sm text-muted-foreground line-clamp-1 italic font-medium">{banner.subtitle}</span>}
                            <div className="flex items-center gap-2 mt-1.5 p-1 px-2 bg-muted/50 rounded w-fit border border-border/50 text-[10px] text-muted-foreground">
                              <ExternalLink className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{banner.link || "Không có link"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <div className="flex justify-center">
                            {(() => {
                              const pos = banner.position?.toLowerCase() || "hero";
                              switch (pos) {
                                case "hero":
                                  return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none px-3 py-1 text-[10px] font-bold tracking-tight">HERO</Badge>;
                                case "sub":
                                  return <Badge className="bg-indigo-500 text-white hover:bg-indigo-600 border-none px-3 py-1 text-[10px] font-bold tracking-tight">SUB</Badge>;
                                case "popup":
                                  return <Badge variant="destructive" className="px-3 py-1 text-[10px] font-bold tracking-tight">POPUP</Badge>;
                                case "category":
                                  return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none px-3 py-1 text-[10px] font-bold tracking-tight">CATEGORY</Badge>;
                                default:
                                  return <Badge variant="outline" className="px-3 py-1 text-[10px] font-bold tracking-tight">{pos.toUpperCase()}</Badge>;
                              }
                            })()}
                          </div>
                        </td>
                        <td className="py-5 px-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-1 px-2 rounded border border-border/30 w-fit">
                              <Calendar className="h-3 w-3 text-primary/70" />
                              <span className="font-medium">{banner.startDate ? format(new Date(banner.startDate), "dd/MM/yyyy") : "---"}</span>
                              <span className="opacity-50">to</span>
                              <span className={cn("font-bold", isExpired(banner.endDate) ? "text-destructive" : "text-foreground/80")}>
                                {banner.endDate ? format(new Date(banner.endDate), "dd/MM/yyyy") : "---"}
                              </span>
                            </div>
                            {banner.endDate && isExpired(banner.endDate) && <Badge variant="destructive" className="w-fit h-4 text-[9px] px-1.5 font-bold animate-pulse">HẾT HẠN</Badge>}
                          </div>
                        </td>
                        <td className="py-5 px-4">
                          <div className="flex justify-center">
                            <Switch checked={banner.isActive} onCheckedChange={() => toggleActive(banner)} className="data-[state=checked]:bg-primary" />
                          </div>
                        </td>
                        <td className="py-5 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/20 hover:bg-primary/20 hover:text-primary transition-all group-hover:translate-y-[-2px]" onClick={() => openEditDialog(banner)}><Pencil className="h-4.5 w-4.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/20 hover:bg-destructive/10 hover:text-destructive transition-all group-hover:translate-y-[-2px]" onClick={() => handleDelete(banner.id)}><Trash2 className="h-4.5 w-4.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="mt-4">
                <PaginationControl currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} />
              </div>
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tiêu đề chính</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="VD: SALE MÙA HÈ" />
              </div>
              <div className="grid gap-2">
                <Label>Tiêu đề phụ (Subtitle)</Label>
                <Input value={formData.subtitle || ""} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} placeholder="VD: Giảm đến 50%" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Mô tả chi tiết</Label>
              <Input value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="VD: Chương trình khuyến mãi cực lớn trong năm..." />
            </div>
            <div className="grid gap-2">
              <Label>Liên kết (URL)</Label>
              <Input value={formData.link || ""} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="/product/1 hoặc https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Vị trí hiển thị</Label>
                <Select
                  value={formData.position}
                  onValueChange={(val) => setFormData({ ...formData, position: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vị trí" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Banner chính (Hero)</SelectItem>
                    <SelectItem value="sub">Banner phụ (Sub)</SelectItem>
                    <SelectItem value="popup">Banner nổi (Popup)</SelectItem>
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
                  Đang lưu...
                </>
              ) : (
                editingBanner ? "Cập nhật" : "Tạo mới"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannersManagement;
