import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, X, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
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
import { MultiSearchableSelect } from "../../components/MultiSearchableSelect";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import type {
  IAttribute,
  IAttributeValue,
  ICreateAttribute,
  ICreateAttributeValue,
  IUpdateAttribute,
  IUpdateAttributeValue,
} from "../../types/attribute.type";
import {
  attributeService,
  attributeValueService,
} from "../../service/attributeService";
import type { ICategory } from "../../types/category.type";
import { categoryService } from "../../service/categoryService";
import PaginationControl from "../../components/PaginationControl";

const AttributesManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdParam = searchParams.get("categoryId");

  const [attributes, setAttributes] = useState<IAttribute[] | undefined>([]);
  const [selectedAttribute, setSelectedAttribute] = useState<IAttribute | null>(
    null,
  );
  const [attributeValues, setAttributesValues] = useState<
    IAttributeValue[] | undefined
  >([]);

  const [allCategories, setAllCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [sort] = useState("");

  // Attribute dialog
  const [isAttrDialogOpen, setIsAttrDialogOpen] = useState(false);
  const [editingAttributeId, setEditingAttributeId] = useState<number | null>(
    null,
  );
  const [attrForm, setAttrForm] = useState<ICreateAttribute>({
    name: "",
    categoryIds: [],
    active: true,
  });

  // Value dialog
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false);
  const [editingValueId, setEditingValueId] = useState<number | null>(null);
  const [valueForm, setValueForm] = useState<ICreateAttributeValue>({
    value: "",
    attributeId: null,
  });

  const fetchAttributes = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await attributeService.getAll(
        currentPage - 1,
        pageSize,
        search,
        sort,
        categoryIdParam || undefined,
      );
      if (res.data) {
        setAttributes(res.data.result);
        setTotalPages(res.data.meta.pages);
      }
    } catch {
      toast.error("Không thể tải danh sách thuộc tính");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, sort, categoryIdParam]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const fetchCategory = useCallback(async () => {
    try {
      const res = await categoryService.getAll(0, 1000, "", "name,asc");
      if (res.data) {
        setAllCategories(res.data.result);
      }
    } catch (err) {
      console.error("Error fetching categories", err);
    }
  }, []);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  // ---- Attribute CRUD ----
  const handleOpenAttrDialog = useCallback((attribute?: IAttribute) => {
    if (attribute) {
      setEditingAttributeId(attribute.id);
      setAttrForm({
        name: attribute.name,
        categoryIds: attribute.categories.map((c) => c.id),
        active: attribute.active,
      });
    } else {
      setEditingAttributeId(null);
      setAttrForm({ name: "", categoryIds: [], active: true });
    }
    setIsAttrDialogOpen(true);
  }, []);

  const handleDeleteAttr = useCallback(async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thuộc tính này?")) {
      try {
        await attributeService.remove(Number(id));
        toast.success("Đã xóa thuộc tính");
        fetchAttributes();
      } catch {
        toast.error("Không thể xóa thuộc tính");
      }
    }
  }, [fetchAttributes]);

  const handleSaveAttr = useCallback(async () => {
    if (!attrForm.name) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
      if (editingAttributeId) {
        const updateData: IUpdateAttribute = {
          id: editingAttributeId,
          name: attrForm.name,
          active: attrForm.active,
          categoryIds: attrForm.categoryIds,
        };
        await attributeService.update(updateData);
        toast.success("Đã cập nhật thuộc tính");
      } else {
        await attributeService.create(attrForm);
        toast.success("Đã thêm thuộc tính mới");
      }
      setIsAttrDialogOpen(false);
      fetchAttributes();
    } catch {
      toast.error("Đã xảy ra lỗi");
    }
  }, [editingAttributeId, attrForm, fetchAttributes]);

  // ---- Value CRUD ----

  const fetchAttributeValues = useCallback(async (attributeId: number) => {
    const res = await attributeValueService.getAll(attributeId.toString());

    if (!res.error) {
      setAttributesValues(res.data?.result);
    }
  }, []);

  useEffect(() => {
    if (!selectedAttribute?.id) return;
    fetchAttributeValues(selectedAttribute.id);
  }, [selectedAttribute?.id, fetchAttributeValues]);

  const handleOpenValueDialog = useCallback((value?: IAttributeValue) => {
    if (value) {
      setEditingValueId(value.id);
      setValueForm({ value: value.value, attributeId: value.attribute.id });
    } else {
      setEditingValueId(null);
      setValueForm({ value: "", attributeId: selectedAttribute?.id ?? null });
    }
    setIsValueDialogOpen(true);
  }, [selectedAttribute?.id]);

  const handleDeleteValue = useCallback(async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa giá trị này?")) {
      try {
        await attributeValueService.remove(Number(id));
        toast.success("Đã xóa giá trị");
        if (selectedAttribute?.id) fetchAttributeValues(selectedAttribute.id);
      } catch {
        toast.error("Không thể xóa giá trị");
      }
    }
  }, [selectedAttribute?.id, fetchAttributeValues]);

  const handleSaveValue = useCallback(async () => {
    if (!selectedAttribute) return;
    if (!valueForm.value.trim()) {
      toast.error("Vui lòng nhập giá trị");
      return;
    }
    try {
      if (editingValueId) {
        const updateData: IUpdateAttributeValue = {
          id: editingValueId,
          value: valueForm.value,
          attributeId: selectedAttribute.id,
        };
        await attributeValueService.update(updateData);
        toast.success("Đã cập nhật giá trị");
      } else {
        const createData: ICreateAttributeValue = {
          value: valueForm.value,
          attributeId: selectedAttribute.id,
        };
        await attributeValueService.create(createData);
        toast.success("Đã thêm giá trị mới");
      }

      fetchAttributeValues(selectedAttribute.id);
      setIsValueDialogOpen(false);
    } catch {
      toast.error("Đã xảy ra lỗi");
    }
  }, [selectedAttribute, valueForm.value, editingValueId, fetchAttributeValues]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý Thuộc tính</h1>
        <p className="text-muted-foreground">
          Tạo thuộc tính trước, sau đó thêm các giá trị cho thuộc tính
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* === LEFT: Attributes List === */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Thuộc tính</h2>
            <Button size="sm" onClick={() => handleOpenAttrDialog()}>
              <Plus className="h-4 w-4 mr-1" /> Thêm
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm thuộc tính..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {categoryIdParam && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  searchParams.delete("categoryId");
                  setSearchParams(searchParams);
                }}
                className="whitespace-nowrap"
              >
                <X className="h-4 w-4 mr-2" /> Xóa lọc
              </Button>
            )}
          </div>
          <div className={cn("relative transition-opacity duration-300", isLoading ? "opacity-50" : "opacity-100")}>
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center -top-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Thể Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-6 w-24 animate-pulse bg-muted rounded" /></TableCell>
                      <TableCell><div className="h-6 w-16 animate-pulse bg-muted rounded" /></TableCell>
                      <TableCell><div className="h-6 w-16 animate-pulse bg-muted rounded" /></TableCell>
                      <TableCell><div className="h-6 w-20 animate-pulse bg-muted rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : attributes?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      Chưa có thuộc tính nào
                    </TableCell>
                  </TableRow>
                ) : (
                  attributes?.map((attr) => (
                    <TableRow
                      key={attr.id}
                      className={`cursor-pointer transition-colors ${selectedAttribute?.id === attr.id ? "bg-accent" : ""}`}
                      onClick={() => setSelectedAttribute(attr)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{attr.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {attr.name + " (" + attr.categories.length + " thể loại)"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {attr.categories.map((cat) => (
                            <Badge key={cat.id} variant="outline" className="text-[10px] px-1 h-5">
                              {cat.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={attr.active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {attr.active ? "Hoạt động" : "Ẩn"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAttrDialog(attr);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAttr(attr.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground self-center" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>

        {/* === RIGHT: Attribute Values === */}
        <div className="space-y-4">
          {selectedAttribute ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Giá trị của:{" "}
                    <span className="text-primary">
                      {selectedAttribute.name}
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedAttribute.name}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleOpenValueDialog()}>
                  <Plus className="h-4 w-4 mr-1" /> Thêm giá trị
                </Button>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Giá trị</TableHead>
                      {selectedAttribute.name === "Màu sắc" && (
                        <TableHead>Tên hiển thị</TableHead>
                      )}
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attributeValues?.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={selectedAttribute.name === "Màu sắc" ? 3 : 2}
                          className="text-center text-muted-foreground py-8"
                        >
                          Chưa có giá trị nào. Nhấn "Thêm giá trị" để bắt đầu.
                        </TableCell>
                      </TableRow>
                    )}

                    {attributeValues?.map((val) => (
                      <TableRow key={val.id}>
                        <TableCell>
                          {selectedAttribute?.name === "Màu sắc" ? (
                            <span className="flex items-center gap-2">
                              <span
                                className="w-5 h-5 rounded-full border"
                                style={{ backgroundColor: val.value }}
                              />
                              <span className="font-mono text-sm">
                                {val.value}
                              </span>
                            </span>
                          ) : (
                            <span>{val.value}</span>
                          )}
                        </TableCell>
                        {selectedAttribute?.name === "Màu sắc" && (
                          <TableCell>{val.value || "—"}</TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenValueDialog(val)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleDeleteValue(val.id.toString())
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <PaginationControl
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[300px] border rounded-lg bg-muted/30">
              <div className="text-center text-muted-foreground">
                <ChevronRight className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="font-medium">Chọn một thuộc tính</p>
                <p className="text-sm">để xem và quản lý các giá trị</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === Attribute Dialog === */}
      <Dialog open={isAttrDialogOpen} onOpenChange={setIsAttrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAttributeId ? "Sửa thuộc tính" : "Thêm thuộc tính mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên thuộc tính *</Label>
              <Input
                value={attrForm.name}
                onChange={(e) =>
                  setAttrForm({ ...attrForm, name: e.target.value })
                }
                placeholder="VD: Dung tích"
              />
            </div>
            <div className="space-y-2">
              <Label>Thể loại </Label>
              <MultiSearchableSelect
                options={allCategories?.map((cat) => ({
                  value: cat.id.toString(),
                  label: cat.name,
                })) || []}
                value={attrForm.categoryIds.map(String)}
                onValueChange={(values) =>
                  setAttrForm({
                    ...attrForm,
                    categoryIds: values.map(Number),
                  })
                }
                placeholder="Chọn các thể loại"
                searchPlaceholder="Tìm tên thể loại..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={attrForm.active}
                onCheckedChange={(c) => setAttrForm({ ...attrForm, active: c })}
              />
              <Label htmlFor="isActive">Hoạt động</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAttrDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleSaveAttr}>
              {editingAttributeId ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Value Dialog === */}
      <Dialog open={isValueDialogOpen} onOpenChange={setIsValueDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingValueId ? "Sửa giá trị" : "Thêm giá trị mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Giá trị *</Label>
              <Input
                value={valueForm.value}
                onChange={(e) =>
                  setValueForm({ ...valueForm, value: e.target.value })
                }
                placeholder={
                  selectedAttribute?.name === "Màu sắc"
                    ? "Đỏ san hô"
                    : "Nhập giá trị"
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsValueDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleSaveValue}>
              {editingValueId ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttributesManagement;
