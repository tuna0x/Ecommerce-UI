import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
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
import { products as initialProducts, categories } from "../../data/products";
import type { Product } from "../../data/products";
import { toast } from "sonner";

const ProductsManagement: React.FC = () => {
  const [productList, setProductList] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    price: "",
    originalPrice: "",
    category: "",
    image: "",
  });

  const filteredProducts = productList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      brand: "",
      price: "",
      originalPrice: "",
      category: "",
      image: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      price: product.price.toString(),
      originalPrice: product.originalPrice.toString(),
      category: product.category,
      image: product.image,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (
      !formData.name ||
      !formData.brand ||
      !formData.price ||
      !formData.category
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const price = parseInt(formData.price);
    const originalPrice = parseInt(formData.originalPrice) || price;
    const discount = Math.round(
      ((originalPrice - price) / originalPrice) * 100,
    );

    if (editingProduct) {
      // Update existing product
      setProductList((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: formData.name,
                brand: formData.brand,
                price,
                originalPrice,
                discount,
                category: formData.category,
                image: formData.image || p.image,
              }
            : p,
        ),
      );
      toast.success("Cập nhật sản phẩm thành công");
    } else {
      // Add new product
      const newProduct: Product = {
        id: Date.now(),
        name: formData.name,
        brand: formData.brand,
        price,
        originalPrice,
        discount,
        category: formData.category,
        image:
          formData.image ||
          "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
        hoverImage:
          formData.image ||
          "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
        rating: 4.5,
        reviewCount: 0,
      };
      setProductList((prev) => [newProduct, ...prev]);
      toast.success("Thêm sản phẩm thành công");
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (productId: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      setProductList((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Xóa sản phẩm thành công");
    }
  };

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
        <Button onClick={openAddDialog} className="gap-2">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm ({filteredProducts.length})</CardTitle>
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
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="py-3 px-2">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="py-3 px-2 text-sm font-medium max-w-[200px] truncate">
                      {product.name}
                    </td>
                    <td className="py-3 px-2 text-sm">{product.brand}</td>
                    <td className="py-3 px-2 text-sm">{product.category}</td>
                    <td className="py-3 px-2 text-sm">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        -{product.discount}%
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
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
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                placeholder="Nhập thương hiệu"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Giá bán (VNĐ)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="originalPrice">Giá gốc (VNĐ)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, originalPrice: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Danh mục</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">URL hình ảnh</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editingProduct ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsManagement;
