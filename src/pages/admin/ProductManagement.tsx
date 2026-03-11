import React, { useState, useRef, useMemo, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { toast } from "sonner";
import type {
  ICreateProduct,
  IPrice,
  IProduct,
  IUpdateProduct,
} from "../../types/product.type";
import type {
  IBrand,
  ICreateBrand,
  IUpdateBrand,
} from "../../types/brand.type";
import { ProductService } from "../../service/productService";
import { number } from "framer-motion";
import type { ICategory } from "../../types/category.type";
import { BrandService } from "../../service/brandService";
import { categoryService } from "../../service/categoryService";
import type { IAttributeValue } from "../../types/attribute.type";
import { attributeValueService } from "../../service/attributeService";

const ProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(0);
  const [sort, setSort] = useState("");
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
        attributeValue: product.attributeValue?.map((attr) => attr.id) ?? [],
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

  const fetchProducts = async () => {
    const res = await ProductService.getAll(
      currentPage - 1,
      pageSize,
      search,
      sort,
    );
    if (!res.error) {
      setProducts(res.data?.result || []);
      setTotalPages(res.data?.meta.pages || 0);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const [brandRes, categoryRes, valueRes] = await Promise.all([
        BrandService.getAll(),
        categoryService.getAll(),
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
  }, [currentPage, search, sort]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };
  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.brandId ||
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
      attributeValue: undefined,
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

  const handleAttributeValueToggle = (attributeId: string, valueId: string) => {
    setSelectedAttributes((prev) => {
      const current = prev[attributeId] || [];
      const updated = current.includes(valueId)
        ? current.filter((id) => id !== valueId)
        : [...current, valueId];

      if (updated.length === 0) {
        const { [attributeId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [attributeId]: updated };
    });
  };

  const filteredAttributes = value.filter(
    (v) => v.attribute?.category?.id === formData.categoryId,
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
      .filter((v) => v.attribute.category.id === formData.categoryId)
      .reduce((acc: any, item: any) => {
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
                {products.map((product) => {
                  const attrBadges = product.attributeValue;
                  return (
                    <tr key={product.id} className="border-b last:border-0">
                      <td className="py-3 px-2">
                        <img
                          src={product.image?.[0] || "/no-image.png"}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      </td>
                      <td className="py-3 px-2 text-sm font-medium max-w-[200px] truncate">
                        {product.name}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {product.brand.name}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {product.category.name}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {(attrBadges ?? [])?.length > 0 ? (
                            attrBadges?.map((attr, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 rounded bg-muted border"
                              >
                                {attr.value}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              /
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm font-medium max-w-[200px] truncate">
                        {product.stock}
                      </td>
                      <td className="py-3 px-2 text-sm font-medium max-w-[200px] truncate">
                        {product.weight}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {formatCurrency(price[product.id]?.originalPrice || 0)}
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          -
                          {price[product.id]?.originalPrice &&
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <Select
                value={formData.brandId?.toString()}
                onValueChange={(value) => {
                  setFormData({ ...formData, brandId: Number(value) });
                  // setSelectedAttributes({});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {brand.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Select
                value={formData.categoryId?.toString()}
                onValueChange={(value) => {
                  setFormData({ ...formData, categoryId: Number(value) });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {category.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                        <ScrollArea className="max-h-32">
                          <div className="flex flex-wrap gap-2">
                            {attr.values.map((val) => {
                              const isSelected = selectedVals.includes(
                                val.id.toString(),
                              );
                              return (
                                <button
                                  key={val.id}
                                  type="button"
                                  onClick={() =>
                                    handleAttributeValueToggle(
                                      attr.attributeId.toString(),
                                      val.id.toString(),
                                    )
                                  }
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                                    isSelected
                                      ? "border-primary bg-primary/10 text-primary font-medium"
                                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                                  }`}
                                >
                                  {val.value}
                                </button>
                              );
                            })}
                          </div>
                        </ScrollArea>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editingProductId ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsManagement;
