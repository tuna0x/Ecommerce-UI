import React, { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, FolderTree, ListChecks, HelpCircle, Loader2, X, SearchX } from "lucide-react";
import { cn } from "../../lib/utils";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { SearchableSelect } from "../../components/SearchableSelect";

import PaginationControl from "../../components/PaginationControl";
import { useDebounce } from "../../hooks/useDebounce";
import ConfirmModal from "../../components/ConfirmModal";
import type {
  ICategory,
  ICreateCategory,
  IUpdateCategory,
} from "../../types/category.type";
import { categoryService } from "../../service/categoryService";

const CategoriesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<ICategory[]>([]);
  const [allCategories, setAllCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ICreateCategory>({
    name: "",
    description: "",
    parentId: null,
    active: true,
  });

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await categoryService.getAll(
        currentPage - 1,
        10,
        debouncedSearch,
        "updatedAt,desc",
      );
      if (res.data) {
        setCategory(res.data.result);
        setTotalPages(res.data.meta.pages);
      }
    } catch {
      toast.error("Không thể tải danh sách thể loại");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  const fetchAllCategories = useCallback(async () => {
    try {
      const res = await categoryService.getAll(0, 1000, "", "name,asc");
      if (res.data) {
        setAllCategories(res.data.result);
      }
    } catch {
      console.error("Error fetching all categories");
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      active: true,
      parentId: null,
    });
    setEditingId(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.name) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
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
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error) {
        const axiosError = error as { response?: { data?: { message?: unknown } } };
        const backendMsg = axiosError.response?.data?.message;
        const finalMsg = Array.isArray(backendMsg) ? backendMsg[0] : backendMsg;
        toast.error(finalMsg || "Đã xảy ra lỗi khi lưu thể loại");
    }
  }, [editingId, formData, fetchCategories, resetForm]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await categoryService.remove(id);
      toast.success("Đã xóa thể loại thành công");
      fetchCategories();
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || "Không thể xóa thể loại";
      toast.error(message);
    }
  }, [fetchCategories]);

  const handleOpenDialog = useCallback((category?: ICategory) => {
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
        active: true,
        parentId: null,
      });
    }
    setIsDialogOpen(true);
  }, []);

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
        <div className="relative flex-1 max-w-sm group">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
            isLoading ? "text-primary animate-pulse" : "text-muted-foreground group-focus-within:text-primary"
          )} />
          <Input
            placeholder="Tìm kiếm thể loại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center -top-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Desktop View: Table */}
        <div className="hidden md:block">
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
                {isLoading ? (
                Array.from({ length: pageSize }).map((_, idx) => (
                    <TableRow key={idx}>
                    <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-[100px] ml-auto" /></TableCell>
                    </TableRow>
                ))
                ) : category?.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 px-4">
                        <div className="flex flex-col items-center justify-center max-w-[200px] mx-auto text-muted-foreground">
                          <div className="relative mb-4">
                             <SearchX className="w-12 h-12 opacity-20" />
                          </div>
                          <p className="font-semibold text-foreground">Không tìm thấy kết quả</p>
                          <p className="text-xs mt-1 text-center font-normal">Vui lòng thử lại với từ khóa khác</p>
                          {search && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              onClick={() => setSearch("")}
                              className="mt-2 text-primary h-auto p-0"
                            >
                              Xóa tìm kiếm
                            </Button>
                          )}
                        </div>
                    </TableCell>
                </TableRow>
                ) : (
                category?.map((category) => (
                    <TableRow key={category.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                        {category.parentCategory?.id ? (
                            <FolderTree className="h-4 w-4 text-muted-foreground opacity-70" />
                        ) : (
                            <div className="w-4" />
                        )}
                        {category.name}
                        </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                        {category.slug}
                    </TableCell>
                    <TableCell>
                        {category.parentCategory ? (
                        <Badge variant="outline" className="font-normal">
                            {category.parentCategory.name}
                        </Badge>
                        ) : (
                        <span className="text-muted-foreground text-sm italic">Gốc</span>
                        )}
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className="font-medium">
                        {category.productCount || 0}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={category.active ? "default" : "secondary"} className="rounded-full">
                        {category.active ? "Hoạt động" : "Ẩn"}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                        {new Date(category.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                        <TooltipProvider>
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(`/admin/attributes?categoryId=${category.id}`)}
                                >
                                <ListChecks className="h-4 w-4 text-primary" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xem thuộc tính</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(category)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmModal
                            title="Xác nhận xóa"
                            description={`Bạn có chắc chắn muốn xóa thể loại "${category.name}"? Hành động này có thể ảnh hưởng đến các sản phẩm thuộc thể loại này.`}
                            onConfirm={() => handleDelete(category.id)}
                            variant="destructive"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </ConfirmModal>
                        </div>
                    </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
            </Table>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-4">
            {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="p-4 border rounded-xl space-y-3">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                        <div className="flex justify-between">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    </div>
                ))
            ) : category?.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground border rounded-xl">
                    Không tìm thấy thể loại nào.
                </div>
            ) : (
                category?.map((cat) => (
                    <div key={cat.id} className="p-4 border rounded-xl bg-white shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    {cat.parentCategory?.id && <FolderTree className="h-3 w-3 text-muted-foreground" />}
                                    {cat.name}
                                </h3>
                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">{cat.slug}</p>
                            </div>
                            <Badge variant={cat.active ? "default" : "secondary"} className="text-[10px] scale-90">
                                {cat.active ? "Hoạt động" : "Ẩn"}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <span className="font-semibold text-slate-700">{cat.productCount || 0}</span> SP
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                            <span>
                                {cat.parentCategory ? (
                                    <span className="text-pink-600 font-medium">@{cat.parentCategory.name}</span>
                                ) : "Danh mục Gốc"}
                            </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <span className="text-[10px] text-slate-400">
                                {new Date(cat.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-[10px]"
                                    onClick={() => navigate(`/admin/attributes?categoryId=${cat.id}`)}
                                >
                                    <ListChecks className="h-3 w-3 mr-1" />
                                    Thuộc tính
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleOpenDialog(cat)}
                                >
                                    <Pencil className="h-3 w-3" />
                                </Button>
                                <ConfirmModal
                                    title="Xác nhận xóa"
                                    description={`Xóa thể loại "${cat.name}"?`}
                                    onConfirm={() => handleDelete(cat.id)}
                                    variant="destructive"
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive border-destructive/20"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </ConfirmModal>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

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
              <SearchableSelect
                options={[
                  { value: "none", label: "Danh mục gốc" },
                  ...(allCategories
                    ?.filter((cat) => cat.id !== editingId)
                    .map((cat) => ({
                      value: cat.id.toString(),
                      label: cat.name,
                    })) || []),
                ]}
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
                placeholder="Chọn thể loại cha"
                searchPlaceholder="Tìm tên thể loại..."
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Trạng thái hoạt động</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Nếu tắt, thể loại này và các sản phẩm thuộc về nó sẽ không hiển thị trên cửa hàng.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
