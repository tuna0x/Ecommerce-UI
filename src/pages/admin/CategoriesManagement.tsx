import React, { useEffect, useState } from "react";
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
import { toast } from "sonner";

import PaginationControl from "../../components/PaginationControl";
import type {
  ICategory,
  ICreateCategory,
  IUpdateCategory,
} from "../../types/category.type";
import { categoryService } from "../../service/categoryService";

const CategoriesManagement: React.FC = () => {
  const [category, setCategory] = useState<ICategory[] | undefined>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ICreateCategory>({
    name: "",
    description: "",
    parentId: null,
    active: true,
  });

  const fetchCategories = async () => {
    const res = await categoryService.getAll(
      currentPage - 1,
      pageSize,
      search,
      sort,
    );

    if (!res.error) {
      setCategory(res.data?.result || []);
      setTotalPages(res.data?.meta.pages || 0);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentPage, search, sort]);

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (editingId) {
      const updateData: IUpdateCategory = {
        id: editingId,
        name: formData.name,
        description: formData.description,
        active: !!formData.active,
        parentId: formData.parentId,
      };

      await categoryService.update(updateData);
      toast.success("Đã cập nhật thể loại");
    } else {
      await categoryService.create(formData);
      toast.success("Đã thêm mới thể loại");
    }
    resetForm();
    fetchCategories();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      active: formData.active,
      parentId: null,
    });
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    const haschildren = category?.some((cate) => cate.parentCategory?.id);
    if (haschildren) {
      toast.error("Không thể xóa thể loại có thể loại con");
      return;
    }
    if (window.confirm("Delete this category?")) {
      await categoryService.remove(Number(id));
      toast.success("Đã xóa thể loại");
      fetchCategories();
    }
  };

  const handleOpenDialog = (category?: ICategory) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        description: category.description,
        active: category.active,
        parentId: category.parentCategory?.id || null,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        active: formData.active,
        parentId: null,
      });
    }
    setIsDialogOpen(true);
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
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
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
              {/* <TableHead>Số sản phẩm</TableHead> */}
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {category?.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {category.parentCategory?.id && (
                      <FolderTree className="h-4 w-4 text-muted-foreground" />
                    )}
                    {category.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {category.slug}
                </TableCell>
                <TableCell>
                  {category.parentCategory
                    ? category.parentCategory.name
                    : "Danh mục gốc"}
                </TableCell>
                {/* <TableCell>{category.productCount}</TableCell> */}
                <TableCell>
                  <Badge variant={category.active ? "default" : "secondary"}>
                    {category.active ? "Hoạt động" : "Ẩn"}
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
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Sửa thể loại" : "Thêm thể loại mới"}
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
                  });
                }}
                placeholder="Nhập tên thể loại"
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
                value={
                  formData.parentId === null || formData.parentId === undefined
                    ? "none"
                    : formData.parentId.toString()
                }
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    parentId: value === "none" ? null : Number(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thể loại cha (nếu có)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  {category
                    ?.filter((cat) => cat.id !== editingId)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Trạng thái hoạt động</Label>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesManagement;
