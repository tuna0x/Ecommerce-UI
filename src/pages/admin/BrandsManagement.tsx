import React, { useState, useRef } from "react";
import { usePagination } from "../../hooks/usePagination";
import PaginationControl from "../../components/PaginationControl";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Upload,
  ImageIcon,
  X,
} from "lucide-react";
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
  DialogFooter,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { brands as initialBrands } from "../../data/products";
import { toast } from "sonner";

interface Brand {
  id: number;
  name: string;
  logo: string;
  description?: string;
  isActive?: boolean;
}

const BrandsManagement: React.FC = () => {
  const [brandList, setBrandList] = useState<Brand[]>(
    initialBrands.map((b) => ({ ...b, description: "", isActive: true })),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBrands = brandList.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const { currentPage, totalPages, paginatedItems, goToPage } = usePagination(
    filteredBrands,
    10,
  );

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước logo tối đa 2MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openAddDialog = () => {
    setEditingBrand(null);
    setFormData({ name: "", description: "" });
    setLogoPreview(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name, description: brand.description || "" });
    setLogoPreview(brand.logo);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên thương hiệu");
      return;
    }

    const fallbackLogo =
      "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=200&q=80";

    if (editingBrand) {
      setBrandList((prev) =>
        prev.map((b) =>
          b.id === editingBrand.id
            ? {
                ...b,
                name: formData.name,
                description: formData.description,
                logo: logoPreview || b.logo,
              }
            : b,
        ),
      );
      toast.success("Cập nhật thương hiệu thành công");
    } else {
      const newBrand: Brand = {
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        logo: logoPreview || fallbackLogo,
        isActive: true,
      };
      setBrandList((prev) => [newBrand, ...prev]);
      toast.success("Thêm thương hiệu thành công");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa thương hiệu này?")) {
      setBrandList((prev) => prev.filter((b) => b.id !== id));
      toast.success("Xóa thương hiệu thành công");
    }
  };

  const toggleActive = (id: number) => {
    setBrandList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)),
    );
  };

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thương hiệu ({filteredBrands.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Logo
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Tên thương hiệu
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Mô tả
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                    Trạng thái
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((brand) => (
                  <tr key={brand.id} className="border-b last:border-0">
                    <td className="py-3 px-2">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-12 h-12 object-contain rounded-lg border border-border bg-muted/30 p-1"
                      />
                    </td>
                    <td className="py-3 px-2 text-sm font-medium">
                      {brand.name}
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground max-w-[250px] truncate">
                      {brand.description || "—"}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Switch
                        checked={brand.isActive !== false}
                        onCheckedChange={() => toggleActive(brand.id)}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(brand)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(brand.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Không tìm thấy thương hiệu nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? "Sửa thương hiệu" : "Thêm thương hiệu mới"}
            </DialogTitle>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editingBrand ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandsManagement;
