import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search, FolderTree } from "lucide-react";
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
import { mockCategories } from "../../data/mockCategories";
import type { Category } from "../../data/mockCategories";
import { toast } from "sonner";

const CategoriesManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    isActive: true,
  });

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const parentCategories = categories.filter((cat) => !cat.parentId);

  const getParentName = (parentId?: string) => {
    if (!parentId) return "—";
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name || "—";
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId || "",
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        parentId: "",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.slug) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (editingCategory) {
      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id
            ? {
                ...cat,
                ...formData,
                parentId: formData.parentId || undefined,
              }
            : cat,
        ),
      );
      toast.success("Đã cập nhật thể loại");
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        ...formData,
        parentId: formData.parentId || undefined,
        productCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setCategories([...categories, newCategory]);
      toast.success("Đã thêm thể loại mới");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const hasChildren = categories.some((cat) => cat.parentId === id);
    if (hasChildren) {
      toast.error("Không thể xóa thể loại có thể loại con");
      return;
    }
    setCategories(categories.filter((cat) => cat.id !== id));
    toast.success("Đã xóa thể loại");
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Thể loại</h1>
          <p className="text-muted-foreground">Quản lý danh mục sản phẩm</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm thể loại
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm thể loại..."
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
              <TableHead>Tên thể loại</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Thể loại cha</TableHead>
              <TableHead>Số sản phẩm</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {category.parentId && (
                      <FolderTree className="h-4 w-4 text-muted-foreground" />
                    )}
                    {category.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {category.slug}
                </TableCell>
                <TableCell>{getParentName(category.parentId)}</TableCell>
                <TableCell>{category.productCount}</TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Hoạt động" : "Ẩn"}
                  </Badge>
                </TableCell>
                <TableCell>{category.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Sửa thể loại" : "Thêm thể loại mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên thể loại *</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  });
                }}
                placeholder="Nhập tên thể loại"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="ten-the-loai"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả thể loại"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Thể loại cha</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    parentId: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thể loại cha (nếu có)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  {parentCategories
                    .filter((cat) => cat.id !== editingCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
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
              {editingCategory ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesManagement;
