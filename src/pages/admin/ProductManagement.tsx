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
  ChevronDown,
  Tag,
  Package,
  Boxes,
  LayoutGrid,
  Scale,
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

  const hasVariants = (formData.variants || []).length > 0;

  const openDialog = useCallback(async (product: IProduct | null) => {
    if (product) {
      setEditingProductId(product.id);

      const attrValues = product.attributeValue || [];

      // Populate selectedAttributes for UI
      const attributeGroups: Record<string, string[]> = {};
      attrValues.forEach((av) => {
        if (av.attributeId) {
          const attrIdStr = av.attributeId.toString();
          if (!attributeGroups[attrIdStr]) {
            attributeGroups[attrIdStr] = [];
          }
          attributeGroups[attrIdStr].push(av.id.toString());
        }
      });
      setSelectedAttributes(attributeGroups);

      setFormData({
        name: product.name,
        originalPrice: product.originalPrice,
        stock: product.stock,
        image: null,
        categoryId: typeof product.category === 'object' ? product.category.id : null,
        brandId: typeof product.brand === 'object' ? product.brand.id : null,
        attributeValue: attrValues.map((attr) => attr.id),
        variants: product.variants?.map((v) => ({
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          weight: v.weight,
          attributeValues: v.variantAttributes.map(va => {
            // Find the ID in product's attributeValue or current value state
            const attrMatch = [...(product.attributeValue || []), ...value].find(av => {
              const avName = (av as { attributeName?: string }).attributeName || (av as { attribute?: { name: string } }).attribute?.name;
              return av.value === va.value && avName === va.name;
            });
            return attrMatch ? (attrMatch as { id: number }).id : 0;
          }).filter(id => id !== 0)
        })) || []
      });

      // Populate image previews for existing images
      const existingImages = Array.isArray(product.image)
        ? product.image
        : (product.image ? [product.image as string] : []);
      setImagePreviews(existingImages);
    } else {
      setEditingProductId(null);
      setSelectedAttributes({});
      setFormData({
        name: "",
        originalPrice: 0,
        stock: 0,
        image: null,
        categoryId: null,
        brandId: null,
        attributeValue: [],
        variants: []
      });
      setImagePreviews([]);
      setFiles([]);
    }
    setIsDialogOpen(true);
  }, [value]);

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


  useEffect(() => {
    const fetchData = async () => {
      const [brandRes, categoryRes] = await Promise.all([
        BrandService.getAll(0, 1000),
        categoryService.getAll(0, 1000),
      ]);

      if (!brandRes.error) {
        setBrand(brandRes.data?.result || []);
      }

      if (!categoryRes.error) {
        setCategory(categoryRes.data?.result || []);
      }
    };

    fetchData();
  }, []);

  // Fetch attribute values when category changes
  useEffect(() => {
    const fetchAttributeValues = async () => {
      if (!formData.categoryId) {
        setValue([]);
        return;
      }

      try {
        const res = await attributeValueService.getAll(`attribute.categories.id:'${formData.categoryId}'`);
        if (!res.error) {
          setValue(res.data?.result || []);
        }
      } catch (error) {
        console.error("Error fetching attribute values:", error);
      }
    };

    fetchAttributeValues();
  }, [formData.categoryId]);


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
      image: null,
      categoryId: null,
      brandId: null,
      attributeValue: [],
      variants: []
    }); setSelectedAttributes({});
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

      const payload: ICreateProduct = {
        ...formData,
        attributeValue: attrIds,
        variants: formData.variants,
      };

      if (editingProductId) {
        const updateData: IUpdateProduct = {
          id: editingProductId,
          name: formData.name,
          originalPrice: formData.originalPrice,
          stock: formData.stock,
          brandId: formData.brandId,
          categoryId: formData.categoryId,
          // Only send existing Cloudinary URLs to keep
          image: imagePreviews.filter(p => !p.startsWith('blob:')),
          attributeValue: attrIds || [],
          variants: formData.variants,
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
    const previewToRemove = imagePreviews[index];

    // If it's a new upload (blob), find and remove from files state
    if (previewToRemove.startsWith('blob:')) {
      // Find index within only blob previews to match files array
      const blobIndex = imagePreviews
        .slice(0, index)
        .filter(p => p.startsWith('blob:')).length;

      setFiles((prev) => prev.filter((_, i) => i !== blobIndex));
    }

    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
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
    if (!formData.categoryId) return [];

    const groups: Record<number, GroupedAttribute> = {};

    value.forEach((item) => {
      if (!item.attribute) return;

      const attrId = item.attribute.id;
      if (!groups[attrId]) {
        groups[attrId] = {
          attributeId: attrId,
          attributeName: item.attribute.name,
          values: [],
        };
      }

      groups[attrId].values.push({
        id: item.id,
        value: item.value,
      });
    });

    return Object.values(groups);
  }, [value, formData.categoryId]);

  const columns: ColumnDef<IProduct>[] = useMemo(() => [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => row.toggleExpanded()}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      ),
    },
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
            row.original.attributeValue.map((item, index) => {
              const value = (item as { attributeValue?: { value: string } }).attributeValue?.value || (item as { value?: string }).value || "N/A";
              return (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-[10px] px-1.5 h-5 font-normal bg-background shrink-0"
                >
                  {value}
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
      id: "price",
      header: "Giá",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary">
              {formatCurrency(product.finalPrice || product.originalPrice)}
            </span>
            {(product.discountPrice ?? 0) > 0 && (
              <span className="text-[10px] text-muted-foreground line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "discount",
      header: "Giảm giá",
      cell: ({ row }) => {
        const product = row.original;
        const discountPercentage = product.originalPrice && product.discountPrice
          ? Math.round((Number(product.discountPrice) / Number(product.originalPrice)) * 100)
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
  ], [formatCurrency, openDialog, handleDelete]);

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
              getRowCanExpand={(row) => (row.original.variants?.length || 0) > 0}
              renderSubComponent={({ row }) => (
                <div className="p-4 bg-muted/20 border-y border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      {row.original.variants?.length} Biến thể
                    </Badge>
                    <span className="text-xs text-muted-foreground italic">
                      Chi tiết các phiên bản của {row.original.name}
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border/50 shadow-md bg-background">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border/50">
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                              <Tag className="h-3.5 w-3.5" />
                              SKU / Phiên bản
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                              <LayoutGrid className="h-3.5 w-3.5" />
                              Thuộc tính
                            </div>
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase tracking-wider">
                            <div className="flex items-center gap-1.5 justify-end">
                              <Scale className="h-3.5 w-3.5" />
                              Weight
                            </div>
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase tracking-wider">
                            <div className="flex items-center gap-1.5 justify-end">
                              <Boxes className="h-3.5 w-3.5" />
                              Kho
                            </div>
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase tracking-wider">
                            <div className="flex items-center gap-1.5 justify-end">
                              <Package className="h-3.5 w-3.5" />
                              Giá bán
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {row.original.variants?.map((variant, idx: number) => (
                          <tr key={idx} className="hover:bg-primary/[0.02] transition-colors group">
                            <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground font-medium group-hover:text-primary transition-colors">
                              {variant.sku}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {variant.variantAttributes?.map((val, vIdx: number) => (
                                  <Badge
                                    key={vIdx}
                                    variant="outline"
                                    className="bg-muted/50 border-border/50 text-[10px] px-1.5 py-0 font-normal h-4.5"
                                  >
                                    <span className="text-muted-foreground mr-1 opacity-70">{val.name}:</span>
                                    {val.value}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              {variant.weight}g
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <Badge
                                  variant={variant.stock > 10 ? "secondary" : (variant.stock > 0 ? "outline" : "destructive")}
                                  className={`text-[10px] h-5 px-1.5 font-medium border-none ${variant.stock > 10 ? 'bg-emerald-50 text-emerald-700' : ''}`}
                                >
                                  {variant.stock} {variant.stock > 0 ? 'sẵn có' : 'hết hàng'}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground group-hover:text-primary transition-colors">
                              <div className="flex flex-col items-end">
                                <span className={(variant.finalPrice && variant.price && variant.finalPrice < variant.price) ? "text-primary" : ""}>
                                  {formatCurrency(variant.finalPrice || variant.price || row.original.originalPrice)}
                                </span>
                                {variant.finalPrice && variant.price && variant.finalPrice < variant.price && (
                                  <span className="text-[10px] text-muted-foreground line-through font-normal">
                                    {formatCurrency(variant.price)}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
              <Label htmlFor="originalPrice" className={hasVariants ? "text-muted-foreground flex items-center gap-2" : ""}>
                Giá gốc (VNĐ)
                {hasVariants && (
                  <span className="text-[10px] font-normal italic text-primary">
                    (Tự động lấy giá thấp nhất từ biến thể)
                  </span>
                )}
              </Label>
              <Input
                id="originalPrice"
                type="number"
                value={formData.originalPrice}
                disabled={hasVariants}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    originalPrice: Number(e.target.value),
                  })
                }
                className={hasVariants ? "bg-muted/50" : ""}
                placeholder="100000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stock" className={hasVariants ? "text-muted-foreground flex items-center gap-2" : ""}>
                  Số lượng
                  {hasVariants && (
                    <span className="text-[10px] font-normal italic text-primary">
                      (Tổng kho biến thể)
                    </span>
                  )}
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  disabled={hasVariants}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: Number(e.target.value) })
                  }
                  className={hasVariants ? "bg-muted/50" : ""}
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

            {/* Variants Section */}
            {groupedAttributes.length > 0 && (
              <div className="grid gap-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Biến thể sản phẩm
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-primary border-primary/50 hover:bg-primary/5"
                      onClick={() => {
                        // 1. Get all selected attribute values in a grouped format
                        const selectedAttributeGroups = groupedAttributes
                          .map(attr => ({
                            attributeId: attr.attributeId,
                            values: attr.values.filter(v =>
                              (selectedAttributes[attr.attributeId] || []).includes(v.id.toString())
                            )
                          }))
                          .filter(group => group.values.length > 0);

                        if (selectedAttributeGroups.length === 0) {
                          toast.error("Vui lòng chọn ít nhất một tổ hợp thuộc tính phía trên!");
                          return;
                        }

                        // 2. Cartesian Product Logic
                        interface AttrValue { id: number; value: string }
                        interface AttrGroup { attributeId: number; values: AttrValue[] }

                        const generateCombinations = (groups: AttrGroup[], index = 0): number[][] => {
                          if (index === groups.length) return [[]];
                          const res: number[][] = [];
                          const currentGroup = groups[index];
                          const nextCombs = generateCombinations(groups, index + 1);

                          currentGroup.values.forEach((val) => {
                            nextCombs.forEach(comb => {
                              res.push([val.id, ...comb]);
                            });
                          });
                          return res;
                        };

                        const allCombinations = generateCombinations(selectedAttributeGroups);

                        // 3. Convert to Variants
                        const newVariants = allCombinations.map((comb, idx) => ({
                          sku: `${formData.name.toUpperCase().replace(/\s+/g, '-')}-${idx + 1}-${Date.now()}`,
                          price: null,
                          stock: 0,
                          weight: 200, // Default weight for variants
                          attributeValues: comb
                        }));

                        setFormData({
                          ...formData,
                          variants: [...(formData.variants || []), ...newVariants]
                        });

                        toast.success(`Đã tạo nhanh ${newVariants.length} biến thể!`);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Tạo nhanh tổ hợp
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => {
                        const newVariant = {
                          sku: `${formData.name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
                          price: null,
                          stock: 0,
                          weight: 0,
                          attributeValues: []
                        };
                        setFormData({
                          ...formData,
                          variants: [...(formData.variants || []), newVariant]
                        });
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Thêm biến thể
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {(formData.variants || []).map((v, vIndex) => (
                    <Card key={vIndex} className="relative overflow-hidden border-border bg-muted/20">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const newVariants = [...(formData.variants || [])];
                          newVariants.splice(vIndex, 1);
                          setFormData({ ...formData, variants: newVariants });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <CardContent className="p-4 grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">SKU</Label>
                            <Input
                              value={v.sku}
                              onChange={(e) => {
                                const newVariants = [...(formData.variants || [])];
                                newVariants[vIndex].sku = e.target.value;
                                setFormData({ ...formData, variants: newVariants });
                              }}
                              className="h-8 text-xs"
                              placeholder="SKU biến thể"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Giá ghi đè (VNĐ)</Label>
                            <Input
                              type="number"
                              value={v.price || ""}
                              onChange={(e) => {
                                const newVariants = [...(formData.variants || [])];
                                newVariants[vIndex].price = e.target.value ? Number(e.target.value) : null;
                                setFormData({ ...formData, variants: newVariants });
                              }}
                              className="h-8 text-xs"
                              placeholder="Sử dụng giá gốc nếu trống"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Kho hàng</Label>
                            <Input
                              type="number"
                              value={v.stock}
                              onChange={(e) => {
                                const newVariants = [...(formData.variants || [])];
                                newVariants[vIndex].stock = Number(e.target.value);
                                setFormData({ ...formData, variants: newVariants });
                              }}
                              className="h-8 text-xs"
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Cân nặng (g)</Label>
                            <Input
                              type="number"
                              value={v.weight}
                              onChange={(e) => {
                                const newVariants = [...(formData.variants || [])];
                                newVariants[vIndex].weight = Number(e.target.value);
                                setFormData({ ...formData, variants: newVariants });
                              }}
                              className="h-8 text-xs"
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Thuộc tính</Label>
                            <div className="flex flex-wrap gap-2">
                              {groupedAttributes.map((attr) => {
                                // Find which value of this attribute is selected for this variant
                                const selectedValueId = v.attributeValues.find(id =>
                                  attr.values.some(av => av.id === id)
                                );

                                return (
                                  <div key={attr.attributeId} className="w-full">
                                    <SearchableSelect
                                      options={attr.values.map(av => ({
                                        value: av.id.toString(),
                                        label: av.value
                                      }))}
                                      value={selectedValueId?.toString() || "none"}
                                      onValueChange={(val) => {
                                        const newVariants = [...(formData.variants || [])];
                                        const attrValueIds = newVariants[vIndex].attributeValues.filter(id =>
                                          !attr.values.some(av => av.id === id)
                                        );
                                        if (val !== "none") {
                                          attrValueIds.push(Number(val));
                                        }
                                        newVariants[vIndex].attributeValues = attrValueIds;
                                        setFormData({ ...formData, variants: newVariants });
                                      }}
                                      placeholder={attr.attributeName}
                                      className="h-8 text-xs w-full"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {formData.variants?.length === 0 && (
                    <div className="text-center py-8 rounded-lg border-2 border-dashed border-border bg-muted/30">
                      <p className="text-sm text-muted-foreground">Chưa có biến thể nào. Nhấn "Thêm biến thể" để bắt đầu.</p>
                    </div>
                  )}
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
