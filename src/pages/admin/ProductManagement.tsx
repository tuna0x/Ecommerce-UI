import React, { useState, useRef, useEffect, useCallback } from "react";
import PaginationControl from "../../components/PaginationControl";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { MultiSearchableSelect } from "../../components/MultiSearchableSelect";
import { SearchableSelect } from "../../components/SearchableSelect";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import type {
  ICreateProduct,
  IPrice,
  IProduct,
  IUpdateProduct,
} from "../../types/product.type";
import type {
  IBrand,
} from "../../types/brand.type";
import type { ICategory } from "../../types/category.type";
import { ProductService } from "../../service/productService";
import { BrandService } from "../../service/brandService";
import { categoryService } from "../../service/categoryService";
import type { IAttributeValue } from "../../types/attribute.type";
import { attributeValueService } from "../../service/attributeService";

const ProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(0);
  const [sort] = useState("createdAt,desc");
  const [price, setPrice] = useState<Record<number, IPrice>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brand, setBrand] = useState<IBrand[]>([]);
  const [category, setCategory] = useState<ICategory[]>([]);
  const [value, setValue] = useState<IAttributeValue[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<ICreateProduct>({
    name: "",
    originalPrice: 0,
    stock: 0,
    weight: 0,
    image: null,
    brandId: null as number | null,
    categoryId: null as number | null,
    attributeValue: [] as number[],
  });

  const openDialog = async (product: IProduct | null) => {
    if (product) {
      setEditingProductId(product.id);
      setFormData({
        name: product.name,
        originalPrice: product.originalPrice,
        stock: product.stock,
        image: product.image,
        weight: product.weight,
        categoryId: product.category.id,
        brandId: product.brand.id || null,
        attributeValue: product.attributeValue?.map((attr: IAttributeValue) => attr.id) ?? [],
      });
    } else {
      setEditingProductId(null);
      setFormData({
        name: "",
        originalPrice: 0,
        stock: 0,
        weight: 0,
        image: null,
        categoryId: null,
        brandId: null,
        attributeValue: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const validFiles: File[] = [];
    const previews: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" vượt quá 5MB`);
        return;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    });

    setFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...previews]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFetchPrice = async (id: number) => {
    const res = await ProductService.getPrice(id);

    if (!res.data) return;
    setPrice((prev) => ({
      ...prev,
      [id]: res.data as IPrice,
    }));
  };

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await ProductService.getAll(
        currentPage - 1,
        pageSize,
        debouncedSearch,
        sort,
      );
      if (!res.error) {
        setProducts(res.data?.result || []);
        setTotalPages(res.data?.meta.pages || 0);
      }
    } catch {
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, sort]);

  useEffect(() => {
    const fetchData = async () => {
      const [brandRes, categoryRes, valueRes] = await Promise.all([
        BrandService.getAll(0, 1000),
        categoryService.getAll(0, 1000),
        attributeValueService.getAll(),
      ]);

      if (!brandRes.error) {
        setBrand(brandRes.data?.result || []);
      }

      if (!categoryRes.error) {
        setCategory(categoryRes.data?.result || []);
      }

      if (!valueRes.error) {
        setValue(valueRes.data?.result || []);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    products.forEach((p) => {
      handleFetchPrice(p.id);
    });
  }, [products]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedSearch, sort, fetchProducts]);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };
  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      if (
        !formData.name ||
        !formData.originalPrice ||
        !formData.categoryId
      ) {
        toast.error("Vui lòng điền đầy đủ thông tin");
        return;
      }

      const attributeValue = Object.values(selectedAttributes)
        .flat()
        .map((id) => Number(id));

      const payload = {
        ...formData,
        attributeValue,
      };

      if (editingProductId) {
        const updateData: IUpdateProduct = {
          id: editingProductId,
          name: formData.name,
          originalPrice: formData.originalPrice,
          stock: formData.stock,
          weight: formData.weight,
          brandId: formData.brandId,
          categoryId: formData.categoryId,
          image: formData.image,
          attributeValue: attributeValue || [],
        };

        await ProductService.update(updateData, files);
        toast.success("Cập nhật sản phẩm thành công");
      } else {
        console.log(formData);

        await ProductService.create(payload, files);
        toast.success("Thêm mới sản phẩm thành công");
      }
      setFiles([]);
      setImagePreviews([]);
      fetchProducts();
      resetForm();
    } catch {
      toast.error("Đã xảy ra lỗi khi lưu sản phẩm");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      originalPrice: 0,
      stock: 0,
      weight: 0,
      image: null,
      categoryId: null,
      brandId: null,
      attributeValue: [],
    });
    setEditingProductId(null);
  };

  const handleDelete = async (productId: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      await ProductService.remove(productId);
      toast.success("Xóa sản phẩm thành công");
      fetchProducts();
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string[]>
  >({});



  const filteredAttributes = value.filter(
    (v) => v.attribute?.categories?.some((cat) => cat.id === formData.categoryId),
  );

  type AttributeValue = {
    id: number;
    value: string;
  };

  type GroupedAttribute = {
    attributeId: number;
    attributeName: string;
    values: AttributeValue[];
  };
  const groupedAttributes: GroupedAttribute[] = Object.values(
    value
      .filter((v) => v.attribute.categories.some((cat) => cat.id === formData.categoryId))
      .reduce((acc: Record<number, GroupedAttribute>, item: IAttributeValue) => {
        const attrId = item.attribute.id;

        if (!acc[attrId]) {
          acc[attrId] = {
            attributeId: attrId,
            attributeName: item.attribute.name,
            values: [],
          };
        }

        acc[attrId].values.push({
          id: item.id,
          value: item.value,
        });

        return acc;
      }, {}),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý sản phẩm
          </h1>
          <p className="text-muted-foreground">Thêm, sửa, xóa sản phẩm</p>
        </div>
        <Button onClick={() => openDialog(null)} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Hình ảnh
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Tên sản phẩm
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Thương hiệu
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Danh mục
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Thuộc tính
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Số lượng(Kho)
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Cân nặng
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Giá
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Giảm giá
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-4 px-2">
                        <Skeleton className="w-12 h-12 rounded" />
                      </td>
                      <td className="py-4 px-2">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-20 opacity-60" />
                      </td>
                      <td className="py-4 px-2">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="py-4 px-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex gap-1 flex-wrap w-24">
                          <Skeleton className="h-5 w-10" />
                          <Skeleton className="h-5 w-10" />
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <Skeleton className="h-4 w-8 mx-auto" />
                      </td>
                      <td className="py-4 px-2 text-center">
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </td>
                      <td className="py-4 px-2">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="py-4 px-2">
                        <Skeleton className="h-5 w-12 rounded-full mx-auto" />
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-muted-foreground italic">
                      Không tìm thấy sản phẩm nào.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const attrBadges = product.attributeValue;
                    return (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2">
                          <div className="relative group/img w-12 h-12">
                            <img
                              src={product.image?.[0] || "/no-image.png"}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded shadow-sm group-hover/img:scale-105 transition-transform"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <p className="text-sm font-semibold text-foreground max-w-[200px] truncate">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">ID: {product.id}</p>
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground font-medium">
                          {product.brand.name}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none font-normal text-[11px]">
                            {product.category.name}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {(attrBadges ?? [])?.length > 0 ? (
                              attrBadges?.map((attr: IAttributeValue, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-[10px] px-1.5 h-5 font-normal bg-background"
                                >
                                  {attr.value}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">
                                Trống
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm text-center font-medium">
                          {product.stock}
                        </td>
                        <td className="py-3 px-2 text-sm text-center text-muted-foreground whitespace-nowrap">
                          {product.weight}g
                        </td>
                        <td className="py-3 px-2 text-sm font-bold text-primary">
                          {formatCurrency(price[product.id]?.originalPrice || 0)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive text-[10px] font-bold rounded">
                            -{price[product.id]?.originalPrice &&
                              price[product.id]?.discountPrice
                              ? Math.round(
                                (1 -
                                  price[product.id].discountPrice /
                                  price[product.id].originalPrice) *
                                100,
                              )
                              : 0}
                            %
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                              onClick={() => openDialog(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(goToPage) => setCurrentPage(goToPage)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !isSubmitting && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProductId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên sản phẩm</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nhập tên sản phẩm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brand">Thương hiệu</Label>
              <SearchableSelect
                options={brand.map((b) => ({
                  value: b.id.toString(),
                  label: b.name,
                }))}
                value={formData.brandId?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, brandId: value === "none" ? null : Number(value) })
                }
                placeholder="Chọn thương hiệu"
                searchPlaceholder="Tìm thương hiệu..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="originalPrice">Giá gốc (VNĐ)</Label>
              <Input
                id="originalPrice"
                type="number"
                value={formData.originalPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    originalPrice: Number(e.target.value),
                  })
                }
                placeholder="100000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stock">Số lượng</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weight">Cân nặng (GRAM)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Danh mục</Label>
              <SearchableSelect
                options={category.map((cat) => ({
                  value: cat.id.toString(),
                  label: cat.name,
                }))}
                value={formData.categoryId?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value === "none" ? null : Number(value) })
                }
                placeholder="Chọn danh mục"
                searchPlaceholder="Tìm danh mục..."
              />
            </div>

            {/* Attribute Values Section */}
            {filteredAttributes.length > 0 && (
              <div className="grid gap-3">
                <Label className="text-base font-semibold">
                  Thuộc tính sản phẩm
                </Label>
                <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/30">
                  {groupedAttributes.map((attr) => {
                    const selectedVals =
                      selectedAttributes[attr.attributeId] || [];
                    return (
                      <div key={attr.attributeId} className="space-y-2">
                        <Label className="text-sm font-medium">
                          {attr.attributeName}
                        </Label>
                        <MultiSearchableSelect
                          options={attr.values.map((v) => ({
                            value: v.id.toString(),
                            label: v.value,
                          }))}
                          value={selectedVals}
                          onValueChange={(values) =>
                            setSelectedAttributes((prev) => ({
                              ...prev,
                              [attr.attributeId]: values,
                            }))
                          }
                          placeholder={`Chọn ${attr.attributeName}...`}
                          searchPlaceholder={`Tìm ${attr.attributeName}...`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.categoryId && filteredAttributes.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Không có thuộc tính nào cho danh mục này.
              </p>
            )}

            <div className="grid gap-2">
              <Label>Hình ảnh sản phẩm</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Image previews grid */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg border border-border overflow-hidden group"
                    >
                      <img
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {index === 0 && (
                        <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                          Chính
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <ImageIcon className="h-6 w-6" />
                <span className="text-sm font-medium">Nhấn để tải ảnh lên</span>
                <span className="text-xs">PNG, JPG, WEBP (tối đa 5MB/ảnh)</span>
              </div>
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
                editingProductId ? "Cập nhật" : "Thêm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsManagement;
