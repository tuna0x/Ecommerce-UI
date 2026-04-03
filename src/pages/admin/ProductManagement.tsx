import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ImageIcon,
  X,
  Loader2,
  FileText,
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
import { Checkbox } from "../../components/ui/Checkbox";
import { DataTable } from "../../components/ui/data-table";
import { cn } from "../../lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
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
  IProductAttributeValueResponse,
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

  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string[]>
  >({});

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

  const openDialog = useCallback(async (product: IProduct | null) => {
    if (product) {
      setEditingProductId(product.id);
      const groupedAttrs: Record<string, string[]> = {};
      (product.attributeValue as unknown as IProductAttributeValueResponse[])?.forEach((attr) => {
        const attribute = attr.attributeValue?.attribute;
        if (attribute) {
          const attrId = attribute.id.toString();
          if (!groupedAttrs[attrId]) groupedAttrs[attrId] = [];
          groupedAttrs[attrId].push(attr.attributeValue.id.toString());
        }
      });
      setSelectedAttributes(groupedAttrs);

      setFormData({
        name: product.name,
        originalPrice: product.originalPrice,
        stock: product.stock,
        image: null, // Reset images for update unless explicitly unchanged
        weight: product.weight,
        categoryId: typeof product.category === 'object' ? product.category.id : null,
        brandId: typeof product.brand === 'object' ? product.brand.id : null,
        attributeValue: (product.attributeValue as unknown as IProductAttributeValueResponse[])?.map((attr) => attr.attributeValue?.id) ?? [],
      });
    } else {
      setEditingProductId(null);
      setSelectedAttributes({});
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
  }, []);

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
  }, [fetchProducts]);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  }, []);

  const resetForm = useCallback(() => {
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
    setSelectedAttributes({});
    setEditingProductId(null);
  }, []);

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

      const attrIds = Object.values(selectedAttributes)
        .flat()
        .map((id) => Number(id));

      const payload = {
        ...formData,
        attributeValue: attrIds,
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
          image: null,
          attributeValue: attrIds || [],
        };

        await ProductService.update(updateData, files);
        toast.success("Cập nhật sản phẩm thành công");
      } else {
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

  const handleDelete = useCallback(async (productId: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      await ProductService.remove(productId);
      toast.success("Xóa sản phẩm thành công");
      fetchProducts();
    }
  }, [fetchProducts]);

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  type AttributeValue = {
    id: number;
    value: string;
  };

  type GroupedAttribute = {
    attributeId: number;
    attributeName: string;
    values: AttributeValue[];
  };

  const filteredAttributes = value.filter(
    (v) => v.attribute?.categories?.some((cat) => cat.id === formData.categoryId),
  );

  const groupedAttributes: GroupedAttribute[] = useMemo(() => {
    return Object.values(
      value
        .filter((v) => v.attribute?.categories?.some((cat) => cat.id === formData.categoryId))
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
  }, [value, formData.categoryId]);

  const columns: ColumnDef<IProduct>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "image",
      header: "Hình ảnh",
      cell: ({ row }) => {
        const image = Array.isArray(row.original.image) ? row.original.image[0] : (row.original.image || "/no-image.png");
        return (
          <div className="w-12 h-12">
            <img
              src={image}
              alt={row.original.name}
              className="w-12 h-12 object-cover rounded shadow-sm"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Tên sản phẩm",
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="text-sm font-semibold text-foreground truncate" title={row.original.name}>
            {row.original.name}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">ID: {row.original.id}</p>
        </div>
      ),
    },
    {
      accessorKey: "brand",
      header: "Thương hiệu",
      cell: ({ row }) => (
        <span>{typeof row.original.brand === 'string' ? row.original.brand : row.original.brand?.name}</span>
      )
    },
    {
      accessorKey: "category",
      header: "Danh mục",
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-normal text-[11px]">
          {typeof row.original.category === 'string' ? row.original.category : row.original.category?.name}
        </Badge>
      ),
    },
    {
      id: "attributes",
      header: "Thuộc tính",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.attributeValue?.length ? (
            (row.original.attributeValue as unknown as IProductAttributeValueResponse[]).map((attr, index) => {
                return (
                    <Badge
                        key={index}
                        variant="outline"
                        className="text-[10px] px-1.5 h-5 font-normal bg-background shrink-0"
                    >
                        {attr.attributeValue?.value || "N/A"}
                    </Badge>
                );
            })
          ) : (
            <span className="text-[10px] text-muted-foreground italic">Trống</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "stock",
      header: "Kho",
      cell: ({ row }) => <div className="text-center font-medium">{row.original.stock}</div>,
    },
    {
      accessorKey: "weight",
      header: "Cân nặng",
      cell: ({ row }) => <div className="text-center text-muted-foreground whitespace-nowrap">{row.original.weight}g</div>,
    },
    {
      id: "price",
      header: "Giá",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-primary">
            {formatCurrency(price[row.original.id]?.finalPrice || row.original.originalPrice)}
          </span>
          {(price[row.original.id]?.discountPrice ?? 0) > 0 && (
            <span className="text-[10px] text-muted-foreground line-through">
              {formatCurrency(price[row.original.id]?.originalPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "discount",
      header: "Giảm giá",
      cell: ({ row }) => {
        const p = price[row.original.id];
        const discountPercentage = p?.originalPrice && p?.discountPrice
          ? Math.round((p.discountPrice / p.originalPrice) * 100)
          : 0;
        
        if (discountPercentage <= 0) return <div className="text-center text-muted-foreground">-</div>;

        return (
          <div className="text-center">
            <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive text-[10px] font-bold rounded">
              -{discountPercentage}%
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Thao tác</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
            asChild
          >
            <Link to={`/admin/product-detail?productId=${row.original.id}`}>
              <FileText className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => openDialog(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [price, formatCurrency, openDialog, handleDelete]);

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

      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center -top-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            
            <DataTable 
              columns={columns} 
              data={products} 
              onDeleteSelected={(rows) => {
                if (confirm(`Bạn có chắc chắn muốn xóa ${rows.length} sản phẩm?`)) {
                  Promise.all(rows.map(r => ProductService.remove(r.id))).then(() => {
                    toast.success("Xóa hàng loạt thành công");
                    fetchProducts();
                  });
                }
              }}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
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
