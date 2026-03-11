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
  GripVertical,
  Eye,
  EyeOff,
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

interface Banner {
  id: number;
  title: string;
  image: string;
  link: string;
  position: "hero" | "sub" | "popup" | "category";
  order: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const positionLabels: Record<Banner["position"], string> = {
  hero: "Banner chính (Hero)",
  sub: "Banner phụ",
  popup: "Popup",
  category: "Banner danh mục",
};

const initialBanners: Banner[] = [
  {
    id: 1,
    title: "Flash Sale Mùa Hè",
    image:
      "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&q=80",
    link: "/flash-sale",
    position: "hero",
    order: 1,
    isActive: true,
    startDate: "2026-03-01",
    endDate: "2026-03-31",
  },
  {
    id: 2,
    title: "Bộ sưu tập mới",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80",
    link: "/category/trang-diem",
    position: "hero",
    order: 2,
    isActive: true,
    startDate: "2026-03-01",
    endDate: "2026-04-30",
  },
  {
    id: 3,
    title: "Ưu đãi thương hiệu",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
    link: "/brands",
    position: "sub",
    order: 1,
    isActive: true,
    startDate: "2026-03-01",
    endDate: "2026-03-15",
  },
];

const BannersManagement: React.FC = () => {
  const [bannerList, setBannerList] = useState<Banner[]>(initialBanners);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    position: "hero" as Banner["position"],
    order: "1",
    startDate: "",
    endDate: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBanners = bannerList.filter((b) =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const { currentPage, totalPages, paginatedItems, goToPage } = usePagination(
    filteredBanners,
    10,
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa 5MB");
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openAddDialog = () => {
    setEditingBanner(null);
    setFormData({
      title: "",
      link: "",
      position: "hero",
      order: "1",
      startDate: "",
      endDate: "",
    });
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      link: banner.link,
      position: banner.position,
      order: banner.order.toString(),
      startDate: banner.startDate,
      endDate: banner.endDate,
    });
    setImagePreview(banner.image);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề banner");
      return;
    }
    if (!imagePreview && !editingBanner) {
      toast.error("Vui lòng tải ảnh banner");
      return;
    }

    if (editingBanner) {
      setBannerList((prev) =>
        prev.map((b) =>
          b.id === editingBanner.id
            ? {
                ...b,
                title: formData.title,
                link: formData.link,
                position: formData.position,
                order: parseInt(formData.order) || 1,
                startDate: formData.startDate,
                endDate: formData.endDate,
                image: imagePreview || b.image,
              }
            : b,
        ),
      );
      toast.success("Cập nhật banner thành công");
    } else {
      const newBanner: Banner = {
        id: Date.now(),
        title: formData.title,
        image: imagePreview!,
        link: formData.link,
        position: formData.position,
        order: parseInt(formData.order) || 1,
        isActive: true,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };
      setBannerList((prev) => [newBanner, ...prev]);
      toast.success("Thêm banner thành công");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa banner này?")) {
      setBannerList((prev) => prev.filter((b) => b.id !== id));
      toast.success("Xóa banner thành công");
    }
  };

  const toggleActive = (id: number) => {
    setBannerList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)),
    );
  };

  const isExpired = (endDate: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm banner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Banners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách banner ({filteredBanners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Ảnh
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Tiêu đề
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Vị trí
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                    Thứ tự
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Thời gian
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
                {paginatedItems.map((banner) => (
                  <tr key={banner.id} className="border-b last:border-0">
                    <td className="py-3 px-2">
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="w-24 h-14 object-cover rounded-lg border border-border"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm font-medium">{banner.title}</div>
                      {banner.link && (
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {banner.link}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="secondary" className="text-xs">
                        {positionLabels[banner.position]}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center text-sm">
                      {banner.order}
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-xs space-y-0.5">
                        {banner.startDate && <div>Từ: {banner.startDate}</div>}
                        {banner.endDate && (
                          <div
                            className={
                              isExpired(banner.endDate)
                                ? "text-destructive"
                                : ""
                            }
                          >
                            Đến: {banner.endDate}{" "}
                            {isExpired(banner.endDate) && "(Hết hạn)"}
                          </div>
                        )}
                        {!banner.startDate && !banner.endDate && (
                          <span className="text-muted-foreground">
                            Không giới hạn
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Switch
                        checked={banner.isActive}
                        onCheckedChange={() => toggleActive(banner.id)}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(banner)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(banner.id)}
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
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Không tìm thấy banner nào
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
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? "Sửa banner" : "Thêm banner mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tiêu đề banner</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Nhập tiêu đề banner"
              />
            </div>
            <div className="grid gap-2">
              <Label>Liên kết (URL)</Label>
              <Input
                value={formData.link}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
                placeholder="/flash-sale hoặc https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Vị trí hiển thị</Label>
                <Select
                  value={formData.position}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      position: v as Banner["position"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Input
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Hình ảnh banner</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative w-full aspect-[21/9] rounded-lg border border-border overflow-hidden group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Đổi ảnh
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => setImagePreview(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[21/9] rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-sm font-medium">
                    Nhấn để tải ảnh banner
                  </span>
                  <span className="text-xs">
                    Tỷ lệ khuyến nghị 21:9 (tối đa 5MB)
                  </span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editingBanner ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannersManagement;
