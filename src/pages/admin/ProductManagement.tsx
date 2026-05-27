import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ImageIcon,
  Loader2,
  FileText,
  ChevronDown,
  Tag,
  Package,
  Boxes,
  LayoutGrid,
  Scale,
  X,
} from "lucide-react";
import { formatNumberWithDots, parseNumberFromDots } from "../../lib/numberUtils";
import { cn } from "../../lib/utils";
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
import VariantBuilder from "../../components/admin/VariantBuilder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Switch } from "../../components/ui/switch";
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
import { useDebounce } from "../../hooks/useDebounce";
import { useSocket } from "../../context/SocketContext";

const ProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sort] = useState("createdAt,desc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brand, setBrand] = useState<IBrand[]>([]);
  const [category, setCategory] = useState<ICategory[]>([]);
  const [value, setValue] = useState<IAttributeValue[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const { stompClient, isConnected } = useSocket();
  const [formData, setFormData] = useState<ICreateProduct>({
    name: "",
    originalPrice: 0,
    costPrice: 0,
    stock: 0,
    image: null,
    brandId: null as number | null,
    categoryId: null as number | null,
    skinType: "",
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
        const productList = res.data?.result || [];
        setProducts(productList);
        setTotalPages(res.data?.meta.pages || 0);
        setTotalProducts(res.data?.meta.total || 0);

        // Clean up processingIds if products now have images
        setProcessingIds(prev => prev.filter(id => {
          const product = productList.find((p: IProduct) => p.id === id);
          // Only keep in processingIds if product wasn't found (maybe deleted/removed from page)
          // or if it still has no images.
          const hasImages = product && Array.isArray(product.image) && product.image.length > 0;
          return !product || !hasImages;
        }));
      }
    } catch {
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, sort]);

  const hasVariants = (formData.variants || []).length > 0;

  const availableImages = useMemo(() => {
    const product = editingProductId ? products.find(p => p.id === editingProductId) : null;

    return imagePreviews.map((url, idx) => {
      // Find if this URL matches any existing productImage to get its ID
      const existingImg = product?.productImages?.find(img => img.imageUrl === url);

      if (existingImg) {
        return { id: existingImg.id, url: existingImg.imageUrl };
      }

      // If not existing, it's a new one. We need its index in the 'files' array.
      // The 'files' array matches the order of 'blob:' urls in imagePreviews.
      const blobIdx = imagePreviews.slice(0, idx).filter(p => p.startsWith('blob:')).length;
      return { url, index: blobIdx };
    });
  }, [editingProductId, products, imagePreviews]);

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
        costPrice: product.costPrice || 0,
        stock: product.stock,
        image: null,
        categoryId: product.category && typeof product.category === 'object' ? product.category.id : null,
        brandId: product.brand && typeof product.brand === 'object' ? product.brand.id : null,
        skinType: product.skinType || "",
        attributeValue: attrValues.map((attr) => attr.id),
        active: product.active !== false,
        variants: product.variants?.map((v) => ({
          sku: v.sku,
          price: v.price,
          costPrice: v.costPrice || 0,
          stock: v.stock,
          weight: v.weight,
          productImageId: v.productImageId,
          attributeValues: v.variantAttributes.map(va => {
            // Find the ID in product's attributeValue or current value state
            const attrMatch = [...(product.attributeValue || []), ...value].find(av => {
              const avName = (av as { attributeName?: string }).attributeName || (av as { attribute?: { name: string } }).attribute?.name;
              const avVal = (av as unknown as { attributeValue?: string }).attributeValue;
              return avVal === va.attributeValue && avName === va.name;
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
        costPrice: 0,
        stock: 0,
        image: null,
        categoryId: null,
        brandId: null,
        skinType: "",
        attributeValue: [],
        variants: [],
        active: true
      });
      setImagePreviews([]);
      setFiles([]);
      setFormData(prev => ({ ...prev, active: true }));
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

  // Real-time refresh when background tasks complete
  useEffect(() => {
    if (isConnected && stompClient) {
      console.log("Subscribing to /topic/product-updates...");
      const subscription = stompClient.subscribe('/topic/product-updates', (message) => {
        const msg = message.body;
        console.log("WebSocket message received:", msg);
        
        // Only show toast if it's about image processing (which takes time)
        if (msg.includes("xử lý xong") || msg.includes("hoàn tất")) {
          toast.success(msg);
        }
        
        // Always refresh silently to keep data in sync
        setTimeout(() => {
          fetchProducts();
        }, 1000);
      });
      return () => subscription.unsubscribe();
    }
  }, [isConnected, stompClient, fetchProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Auto-calculate originalPrice from variants
  useEffect(() => {
    if (formData.variants && formData.variants.length > 0) {
      const prices = formData.variants
        .map(v => v.price)
        .filter((p): p is number => p !== null && p !== undefined && p > 0);

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        if (formData.originalPrice !== minPrice) {
          setFormData(prev => ({
            ...prev,
            originalPrice: minPrice
          }));
        }
      }
    }
  }, [formData.variants, formData.originalPrice]);

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
      costPrice: 0,
      stock: 0,
      image: null,
      categoryId: null,
      brandId: null,
      skinType: "",
      attributeValue: [],
      variants: [],
      active: true
    }); setSelectedAttributes({});
    setEditingProductId(null);
  }, []);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      if (
        !formData.name ||
        formData.originalPrice === undefined ||
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
          costPrice: formData.costPrice || 0,
          stock: formData.stock,
          brandId: formData.brandId,
          skinType: formData.skinType,
          categoryId: formData.categoryId,
          // Only send existing Cloudinary URLs to keep
          image: imagePreviews.filter(p => !p.startsWith('blob:')),
          attributeValue: attrIds || [],
          variants: formData.variants,
          active: formData.active,
        };

        await ProductService.update(updateData, files);
        if (files && files.length > 0) {
          setProcessingIds(prev => [...new Set([...prev, editingProductId])]);
          toast.success("Cập nhật thông tin thành công. Ảnh đang được xử lý...");
        } else {
          toast.success("Cập nhật sản phẩm thành công!");
        }
      } else {
        const res = await ProductService.create(payload, files);
        if (!res.error && res.data?.id) {
          if (files && files.length > 0) {
            setProcessingIds(prev => [...new Set([...prev, Number(res.data!.id)])]);
            toast.success("Thêm sản phẩm thành công. Ảnh đang được xử lý...");
          } else {
            toast.success("Thêm mới sản phẩm thành công!");
          }
        }
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
        value: item.attributeValue,
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
        const isProcessing = processingIds.includes(row.original.id);
        const hasImages = Array.isArray(row.original.image) && row.original.image.length > 0;

        if (isProcessing && !hasImages) {
          return (
            <div className="flex flex-col items-center justify-center p-2 border rounded bg-muted/50 w-16 h-16">
              <span className="text-[10px] text-center font-medium animate-pulse text-primary">Đang xử lý ảnh...</span>
            </div>
          );
        }

        let image = "/logo.jpg";
        if (hasImages) {
          image = row.original.image![0];
        } else if (typeof row.original.image === 'string' && row.original.image) {
          image = row.original.image;
        }

        return (
          <div className="w-12 h-12">
            <img
              src={image}
              alt={row.original.name}
              className="w-12 h-12 object-cover rounded shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("/logo.jpg")) {
                  target.src = "/logo.jpg";
                }
              }}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Tên sản phẩm",
      cell: ({ row }) => (
        <div className="min-w-[220px] py-2">
          <p className="text-sm font-bold text-foreground leading-snug mb-1 line-clamp-2" title={row.original.name}>
            {row.original.name}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 px-1.5 opacity-70">
              ID: {row.original.id}
            </Badge>
            {row.original.skinType && (
              <Badge variant="secondary" className="text-[10px] bg-pink-50 text-pink-600 border-none py-0 h-4">
                {row.original.skinType}
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "brand",
      header: "Thương hiệu",
      cell: ({ row }) => (
        <div className="min-w-[100px] py-1 text-muted-foreground">
          {typeof row.original.brand === 'string' ? row.original.brand : row.original.brand?.name}
        </div>
      )
    },
    {
      accessorKey: "category",
      header: "Danh mục",
      cell: ({ row }) => (
        <div className="min-w-[120px] py-1">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-semibold text-[11px] px-3 py-1">
            {typeof row.original.category === 'string' ? row.original.category : row.original.category?.name}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "active",
      header: "Trạng thái",
      cell: ({ row }) => {
        const product = row.original;
        const isActive = product.active !== false;

        return (
          <div className="min-w-[100px] py-1">
            <Badge
              variant={isActive ? "secondary" : "outline"}
              className={cn(
                "cursor-pointer transition-all px-3 py-1",
                isActive ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-gray-50 text-gray-500"
              )}
              onClick={async (e) => {
                e.stopPropagation();
                const newStatus = !isActive;
                try {
                  const existingImages = Array.isArray(product.image) ? product.image : (product.image ? [product.image as string] : []);
                  await ProductService.update({
                    id: product.id,
                    name: product.name,
                    originalPrice: product.originalPrice,
                    stock: product.stock,
                    categoryId: product.category && typeof product.category === 'object' ? product.category.id : null,
                    brandId: product.brand && typeof product.brand === 'object' ? product.brand.id : null,
                    image: existingImages,
                    attributeValue: product.attributeValue?.map(av => av.id) || [],
                    active: newStatus
                  });
                  toast.success(`Đã ${newStatus ? 'bật' : 'tắt'} sản phẩm`);
                  fetchProducts();
                } catch {
                  toast.error("Không thể cập nhật trạng thái");
                }
              }}
            >
              {isActive ? "Đang bán" : "Ngừng bán"}
            </Badge>
          </div>
        );
      }
    },
    {
      id: "attributes",
      header: "Thuộc tính",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 min-w-[120px] py-1">
          {row.original.attributeValue?.length ? (
            row.original.attributeValue.map((item, index) => {
              const value = (item as unknown as { attributeValue?: string }).attributeValue || "N/A";
              return (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-[10px] px-2 h-5.5 font-medium bg-muted/30 border-muted-foreground/20 shrink-0"
                >
                  {value}
                </Badge>
              );
            })
          ) : (
            <span className="text-[10px] text-muted-foreground italic opacity-50">Trống</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "stock",
      header: "Kho",
      cell: ({ row }) => <div className="min-w-[60px] text-center font-bold text-slate-700">{row.original.stock}</div>,
    },
    {
      id: "price",
      header: () => <div className="text-right pr-4">Giá</div>,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex flex-col items-end min-w-[100px] pr-4 py-2">
            <span className="text-sm font-bold text-pink-600">
              {formatCurrency(product.finalPrice || product.originalPrice)}
            </span>
            {(product.discountPrice ?? 0) > 0 && (
              <span className="text-[10px] text-muted-foreground line-through opacity-60">
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
        <div className="flex items-center justify-end gap-2 py-2">
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
  ], [formatCurrency, openDialog, handleDelete, processingIds, fetchProducts]);

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
          <div className="relative group">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
              isLoading ? "text-primary animate-pulse" : "text-muted-foreground group-focus-within:text-primary"
            )} />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm ({totalProducts})</CardTitle>
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
              getRowCanExpand={(row) => {
                const variants = row.original.variants || [];
                // Only allow expansion if there are variants AND at least one of them is NOT a default variant
                return variants.length > 0 && variants.some(v => !v.sku.startsWith('DEFAULT-'));
              }}
              renderSubComponent={({ row }) => {
                const realVariants = (row.original.variants || []).filter(v => !v.sku.startsWith('DEFAULT-'));
                if (realVariants.length === 0) return null;

                return (
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
                          {realVariants.map((variant, idx: number) => (
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
                                      {val.attributeValue}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-muted-foreground">
                                {variant.weight}g
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex flex-col items-end gap-1.5">
                                  <Badge
                                    variant={variant.stock > 10 ? "secondary" : (variant.stock > 0 ? "outline" : "destructive")}
                                    className={`text-[10px] h-5 px-1.5 font-bold border-none shadow-sm ${variant.stock > 10 ? 'bg-emerald-100 text-emerald-700' : ''}`}
                                  >
                                    {variant.stock} sẵn có
                                  </Badge>
                                  {variant.reservedStock > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] h-4 px-1.5 font-medium border-amber-200 bg-amber-50 text-amber-700 mt-1"
                                    >
                                      {variant.reservedStock} đang giữ
                                    </Badge>
                                  )}
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
                );
              }}
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
            <DialogDescription className="sr-only">
              Biểu mẫu thêm hoặc cập nhật sản phẩm.
            </DialogDescription>
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
            <div className={`grid ${!editingProductId ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
              <div className="grid gap-2">
                <Label htmlFor="originalPrice" className={hasVariants ? "text-muted-foreground flex items-center gap-2" : ""}>
                  Giá bán (VNĐ)
                  {hasVariants && (
                    <span className="text-[10px] font-normal italic text-primary">
                      (Tự động: Min giá biến thể)
                    </span>
                  )}
                </Label>
                <Input
                  id="originalPrice"
                  type="text"
                  value={formatNumberWithDots(formData.originalPrice)}
                  disabled={hasVariants}
                  onChange={(e) => {
                    const rawValue = parseNumberFromDots(e.target.value);
                    setFormData({
                      ...formData,
                      originalPrice: rawValue,
                    });
                  }}
                  className={hasVariants ? "bg-muted/50 font-bold h-10" : "font-bold h-10"}
                  placeholder="100.000"
                />
              </div>
              {!editingProductId && (
                <div className="grid gap-2">
                  <Label htmlFor="costPrice" className={hasVariants ? "text-muted-foreground flex items-center gap-2" : ""}>
                    Giá vốn (VNĐ)
                  </Label>
                  <Input
                    id="costPrice"
                    type="text"
                    value={formatNumberWithDots(formData.costPrice || 0)}
                    disabled={hasVariants}
                    onChange={(e) => {
                      const rawValue = parseNumberFromDots(e.target.value);
                      setFormData({
                        ...formData,
                        costPrice: rawValue,
                      });
                    }}
                    className={hasVariants ? "bg-muted/50 font-bold h-10 text-orange-600" : "font-bold h-10 text-orange-600"}
                    placeholder="80.000"
                  />
                </div>
              )}
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
                  min="0"
                  value={formData.stock}
                  disabled={hasVariants}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: Math.max(0, Number(e.target.value)) })
                  }
                  className={hasVariants ? "bg-muted/50" : ""}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skinType">Loại da phù hợp</Label>
              <SearchableSelect
                options={[
                  { value: "Mọi loại da", label: "Mọi loại da" },
                  { value: "Da dầu", label: "Da dầu" },
                  { value: "Da khô", label: "Da khô" },
                  { value: "Da hỗn hợp", label: "Da hỗn hợp" },
                  { value: "Da nhạy cảm", label: "Da nhạy cảm" },
                  { value: "Da mụn", label: "Da mụn" },
                ]}
                value={formData.skinType || "Mọi loại da"}
                onValueChange={(value) =>
                  setFormData({ ...formData, skinType: value })
                }
                placeholder="Chọn loại da"
                searchPlaceholder="Tìm loại da..."
              />
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

            <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/20">
              <div className="space-y-0.5">
                <Label htmlFor="active" className="text-base font-semibold italic">Trạng thái hiển thị</Label>
                <p className="text-xs text-muted-foreground italic">
                  Cho phép khách hàng nhìn thấy sản phẩm này trên cửa hàng.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={formData.active ? "secondary" : "outline"} className={cn(
                  "pointer-events-none",
                  formData.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-500"
                )}>
                  {formData.active ? "Đang bán" : "Ngừng bán"}
                </Badge>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>
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
              <VariantBuilder
                groupedAttributes={groupedAttributes}
                selectedAttributes={selectedAttributes}
                variants={formData.variants || []}
                onVariantsChange={(variants) => setFormData({ ...formData, variants })}
                productName={formData.name}
                defaultCostPrice={formData.costPrice || 0}
                editingProductId={editingProductId}
                availableImages={availableImages}
              />
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
          <DialogFooter className="px-6 py-4 border-t border-border bg-slate-50/80 gap-2 shrink-0 shadow-[0_-4px_10px_0_rgba(0,0,0,0.05)]">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="rounded-xl px-6 hover:bg-background hover:shadow-md transition-all">
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="rounded-xl px-8 bg-pink-600 text-white hover:bg-pink-700 shadow-lg shadow-pink-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 font-bold"
            >
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
