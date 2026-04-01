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
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { BrandService } from "../../service/brandService";
import type { IBrand, ICreateBrand, IUpdateBrand } from "../../types/brand.type";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";

const BrandsManagement: React.FC = () => {
  const [brandList, setBrandList] = useState<IBrand[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<IBrand | null>(null);
  const [formData, setFormData] = useState<ICreateBrand>({ name: "", description: "", image: "" });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [files, setFiles] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await BrandService.getAll(
        currentPage - 1,
        pageSize,
        debouncedSearch,
        "createdAt,desc"
      );
      if (!res.error) {
        setBrandList(res.data?.result || []);
        setTotalPages(res.data?.meta.pages || 0);
      }
    } catch {
      toast.error("Không thể tải danh sách thương hiệu");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước logo tối đa 2MB");
      return;
    }
    setLogoPreview(URL.createObjectURL(file));
    setFiles(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openAddDialog = useCallback(() => {
    setEditingBrand(null);
    setFormData({ name: "", description: "", image: "" });
    setLogoPreview(null);
    setFiles(null);
    setIsDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((brand: IBrand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name, description: brand.description || "", image: brand.image });
    setLogoPreview(brand.image);
    setFiles(null);
    setIsDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên thương hiệu");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingBrand) {
        const updateData: IUpdateBrand = {
          id: editingBrand.id,
          name: formData.name,
          description: formData.description,
          image: editingBrand.image
        };
        await BrandService.update(updateData, files || undefined);
        toast.success("Cập nhật thương hiệu thành công");
      } else {
        await BrandService.create(formData, files || undefined);
        toast.success("Thêm thương hiệu thành công");
      }
      setIsDialogOpen(false);
      fetchBrands();
    } catch {
      toast.error("Đã xảy ra lỗi khi lưu thương hiệu");
    } finally {
      setIsSubmitting(false);
    }
  }, [editingBrand, formData, files, fetchBrands]);

  const handleDelete = useCallback(async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa thương hiệu này?")) {
      try {
        await BrandService.remove(id);
        toast.success("Xóa thương hiệu thành công");
        fetchBrands();
      } catch {
        toast.error("Không thể xóa thương hiệu");
      }
    }
  }, [fetchBrands]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý thương hiệu
          </h1>
          <p className="text-muted-foreground">
            Thêm, sửa, xóa thương hiệu sản phẩm
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm thương hiệu
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm thương hiệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thương hiệu ({brandList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("relative transition-opacity duration-300", isLoading ? "opacity-50" : "opacity-100")}>
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center -top-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Logo</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Tên thương hiệu</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Mô tả</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Trạng thái</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Hành động</th>
                  </tr>
                </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-4 px-2">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                      </td>
                      <td className="py-4 px-2">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="py-4 px-2">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="py-4 px-2 text-center">
                        <Skeleton className="h-5 w-10 mx-auto rounded-full" />
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : brandList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground italic">
                      Không tìm thấy thương hiệu nào
                    </td>
                  </tr>
                ) : (
                  brandList.map((brand) => (
                    <tr key={brand.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2">
                        <div className="relative group/logo w-12 h-12">
                          <img
                            src={brand.image || "/no-image.png"}
                            alt={brand.name}
                            className="w-12 h-12 object-contain rounded-lg border border-border bg-background p-1 group-hover/logo:scale-105 transition-transform"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm font-semibold">
                        {brand.name}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground max-w-[250px] truncate">
                        {brand.description || "—"}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-none">
                          Hoạt động
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => openEditDialog(brand)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => handleDelete(brand.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </div>
      </CardContent>
    </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !isSubmitting && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[480px] overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? "Sửa thương hiệu" : "Thêm thương hiệu mới"}
            </DialogTitle>
            <DialogDescription>
              {editingBrand ? "Cập nhật thông tin chi tiết cho thương hiệu này" : "Tạo một thương hiệu mới để quản lý sản phẩm"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="brandName">Tên thương hiệu</Label>
              <Input
                id="brandName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nhập tên thương hiệu"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brandDesc">Mô tả</Label>
              <Textarea
                id="brandDesc"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả ngắn về thương hiệu"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Logo thương hiệu</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {logoPreview ? (
                <div className="relative w-24 h-24 rounded-lg border border-border overflow-hidden group mx-auto">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={() => setLogoPreview(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 mx-auto rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-[10px]">Tải logo</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                editingBrand ? "Cập nhật" : "Thêm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandsManagement;
