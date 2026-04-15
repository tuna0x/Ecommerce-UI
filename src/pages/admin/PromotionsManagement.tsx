import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Percent,
  Truck,
  Gift,
  Tag,
  Box,
  Clock,
  Loader2,
  Globe,
  LayoutGrid,
} from "lucide-react";
import PaginationControl from "../../components/PaginationControl";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { IPromotion, PromotionType } from "../../types/promotion.type";
import { PromotionService } from "../../service/promotionService";
import { ProductService } from "../../service/productService";
import { categoryService } from "../../service/categoryService";
import type { ICategory } from "../../types/category.type";
import { toast } from "sonner";
import type { IMeta } from "../../types/api.type";
import { Checkbox } from "../../components/ui/Checkbox";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import type { IProduct } from "../../types/product.type";
import { DATE_MIN, DATE_MAX, isValidDate } from "../../lib/date";
import { formatNumberWithDots, parseNumberFromDots } from "../../lib/numberUtils";

const PromotionsManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<IPromotion[]>([]);
  const [meta, setMeta] = useState<IMeta>({
    page: 1,
    pageSize: 10,
    pages: 0,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<IPromotion | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "PERCENT" as PromotionType,
    discountValue: 0,
    minOrderValue: 0,
    maxDiscountValue: 0,
    startAt: "",
    endAt: "",
    active: true,
    global: false,
    categoryId: undefined as number | undefined,
  });
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [allProducts, setAllProducts] = useState<IProduct[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const fetchPromotions = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const res = await PromotionService.getAll(page, meta.pageSize);
      if (res && res.data && res.data.result) {
        setPromotions(res.data.result);
        if (res.data.meta) setMeta(res.data.meta);
      }
    } catch {
      toast.error("Không thể tải danh sách khuyến mãi");
    } finally {
      setIsLoading(false);
    }
  }, [meta.pageSize]);

  const fetchAllProducts = async () => {
    try {
      const res = await ProductService.getAll(0, 100);
      if (res && res.data && res.data.result) {
        setAllProducts(res.data.result);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getAll(0, 100);
      if (res && res.data && res.data.result) {
        setCategories(res.data.result);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchPromotions(meta.page);
    fetchAllProducts();
    fetchCategories();
  }, [meta.page, fetchPromotions]);

  const filteredPromotions = useMemo(() => {
    return promotions.filter(
      (promo) =>
        promo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [promotions, searchTerm]);

  const getTypeIcon = (type: PromotionType) => {
    const icons: Record<PromotionType, React.ElementType> = {
      PERCENT: Percent,
      FIXED: Tag,
      BUY_X_GET_Y: Gift,
      FREE_SHIPPING: Truck,
    };
    return icons[type] || Percent;
  };

  const getTypeLabel = (type: PromotionType) => {
    const labels: Record<PromotionType, string> = {
      PERCENT: "Giảm %",
      FIXED: "Giảm tiền",
      BUY_X_GET_Y: "Mua X tặng Y",
      FREE_SHIPPING: "Freeship",
    };
    return labels[type] || type;
  };

  const formatValue = (promo: IPromotion) => {
    switch (promo.type) {
      case "PERCENT":
        return `${promo.discountValue}%`;
      case "FIXED":
        return `${(promo.discountValue || 0).toLocaleString()}đ`;
      case "BUY_X_GET_Y":
        return `Tặng ${promo.discountValue}`;
      case "FREE_SHIPPING":
        return "Miễn phí";
      default:
        return String(promo.discountValue || 0);
    }
  };

  const isExpired = (endAt: string) => new Date(endAt) < new Date();

  const handleOpenDialog = useCallback((promotion?: IPromotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        discountValue: promotion.discountValue,
        minOrderValue: promotion.minOrderValue || 0,
        maxDiscountValue: promotion.maxDiscountValue || 0,
        startAt: promotion.startAt ? promotion.startAt.split("T")[0] : "",
        endAt: promotion.endAt ? promotion.endAt.split("T")[0] : "",
        active: promotion.active,
        global: promotion.global,
        categoryId: promotion.categoryId,
      });

      // Fetch assigned products
      PromotionService.getAssignedProducts(promotion.id).then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          const assigned = res.data as { id: number }[];
          setSelectedProductIds(assigned.map((p) => p.id));
        }
      });
    } else {
      setEditingPromotion(null);
      setSelectedProductIds([]);
      setFormData({
        name: "",
        description: "",
        type: "PERCENT",
        discountValue: 0,
        minOrderValue: 0,
        maxDiscountValue: 0,
        startAt: new Date().toISOString().split("T")[0],
        endAt: "",
        active: true,
        global: false,
        categoryId: undefined,
      });
    }
    setActiveTab("info");
    setIsDialogOpen(true);
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.startAt || !formData.endAt) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (!isValidDate(formData.startAt) || !isValidDate(formData.endAt)) {
      toast.error(`Ngày phải trong khoảng từ năm 2000 đến 2100`);
      return;
    }

    // Convert date to LocalDateTime format
    const startAt = `${formData.startAt}T00:00:00`;
    const endAt = `${formData.endAt}T23:59:59`;

    try {
      let promoId: number;
      if (editingPromotion) {
        await PromotionService.update({
          id: editingPromotion.id,
          ...formData,
          startAt,
          endAt,
        });
        promoId = editingPromotion.id;
        toast.success("Đã cập nhật khuyến mãi");
      } else {
        const res = await PromotionService.create({
          ...formData,
          startAt,
          endAt,
        });
        if (!res.data) throw new Error("Chưa nhận được ID khuyến mãi");
        promoId = res.data.id;
        toast.success("Đã thêm khuyến mãi mới");
      }

      // Assign products only if NOT global and NOT category-based
      if (!formData.global && formData.categoryId === undefined) {
        await PromotionService.assignProducts(promoId, selectedProductIds);
      }

      setIsDialogOpen(false);
      fetchPromotions(meta.page);
    } catch {
      toast.error("Có lỗi xảy ra khi lưu khuyến mãi");
    }
  };

  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khuyến mãi này?")) {
      try {
        await PromotionService.delete(id);
        toast.success("Đã xóa khuyến mãi");
        fetchPromotions(meta.page);
      } catch {
        toast.error("Không thể xóa khuyến mãi");
      }
    }
  }, [fetchPromotions, meta.page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Khuyến mãi</h1>
          <p className="text-muted-foreground">
            Quản lý các chương trình khuyến mãi
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm khuyến mãi
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm khuyến mãi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center -top-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <div className="border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên khuyến mãi</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Đã dùng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPromotions.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground italic">
                    Không tìm thấy khuyến mãi nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromotions.map((promotion) => {
                  const TypeIcon = getTypeIcon(promotion.type);
                  const expired = isExpired(promotion.endAt);
                  return (
                    <TableRow key={promotion.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div>
                          <div className="font-medium">{promotion.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {promotion.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {promotion.global ? (
                          <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">
                            <Globe className="h-3 w-3" />
                            Toàn hệ thống
                          </Badge>
                        ) : promotion.categoryId ? (
                          <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">
                            <LayoutGrid className="h-3 w-3" />
                            {categories.find(c => c.id === promotion.categoryId)?.name || "Danh mục"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Box className="h-3 w-3" />
                            Sản phẩm lẻ
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <TypeIcon className="h-3 w-3" />
                          {getTypeLabel(promotion.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {formatValue(promotion)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {promotion.startAt?.split("T")[0]}
                          </div>
                          <div className="text-muted-foreground pl-4 flex items-center gap-1">
                            → {promotion.endAt?.split("T")[0]}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">0 lần</TableCell>
                      <TableCell>
                        {expired ? (
                          <Badge variant="destructive" className="rounded-full px-2 py-0.5">Hết hạn</Badge>
                        ) : (
                          <Badge
                            variant={promotion.active ? "default" : "secondary"}
                            className="cursor-pointer rounded-full px-2 py-0.5 transition-all hover:scale-105 active:scale-95"
                            onClick={async () => {
                              try {
                                await PromotionService.toggleActive(promotion.id, !promotion.active);
                                toast.success("Đã thay đổi trạng thái");
                                fetchPromotions(meta.page);
                              } catch {
                                toast.error("Lỗi khi thay đổi trạng thái");
                              }
                            }}
                          >
                            {promotion.active ? "Hoạt động" : "Tạm dừng"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted"
                            onClick={() => handleOpenDialog(promotion)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(promotion.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4">
          <PaginationControl
            currentPage={meta.page}
            totalPages={meta.pages}
            onPageChange={(page) => fetchPromotions(page)}
          />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>
              {editingPromotion ? "Cập nhật khuyến mãi" : "Thêm khuyến mãi mới"}
            </DialogTitle>
            <DialogDescription>
              Điền đầy đủ các thông tin chi tiết cho chương trình khuyến mãi bên dưới.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Thông tin chung</TabsTrigger>
                <TabsTrigger
                  value="products"
                  disabled={formData.global || formData.categoryId !== undefined}
                >
                  Sản phẩm áp dụng
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="info" className="outline-none mt-0">
              <ScrollArea className="h-[500px] md:h-[600px] max-h-[65vh] w-full">
                <div className="space-y-4 py-4 px-6">
                  <div className="space-y-2">
                    <Label>Tên khuyến mãi *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="VD: Flash Sale Mùa Hè"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Mô tả chi tiết khuyến mãi"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50/50">
                    <div className="space-y-0.5">
                      <Label className="text-blue-700 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Khuyến mãi Toàn hệ thống
                      </Label>
                      <p className="text-xs text-blue-600/70">
                        Áp dụng cho tất cả sản phẩm hiện có
                      </p>
                    </div>
                    <Switch
                      checked={formData.global}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, global: checked, categoryId: undefined })
                      }
                    />
                  </div>

                  {!formData.global && (
                    <div className="space-y-2">
                      <Label>Áp dụng cho Danh mục</Label>
                      <Select
                        value={formData.categoryId?.toString() || "none"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            categoryId: value === "none" ? undefined : Number(value)
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục (Không bắt buộc)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Không chọn (Áp dụng SP lẻ)</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground italic">
                        * Nếu chọn danh mục, khuyến mãi sẽ áp dụng cho tất cả sản phẩm trong danh mục này.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Loại khuyến mãi</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: PromotionType) =>
                          setFormData({ ...formData, type: value, discountValue: value === "PERCENT" ? Math.min(100, formData.discountValue) : formData.discountValue })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT">Giảm theo %</SelectItem>
                          <SelectItem value="FIXED">Giảm tiền cố định</SelectItem>
                          <SelectItem value="BUY_X_GET_Y">Mua X tặng Y</SelectItem>
                          <SelectItem value="FREE_SHIPPING">
                            Miễn phí vận chuyển
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {formData.type === "PERCENT"
                          ? "Phần trăm giảm"
                          : formData.type === "FIXED"
                            ? "Số tiền giảm"
                            : formData.type === "BUY_X_GET_Y"
                              ? "Số lượng tặng"
                              : "Giá trị"}
                      </Label>
                      <Input
                        type="text"
                        value={formatNumberWithDots(formData.discountValue)}
                        onChange={(e) => {
                          const val = Math.max(0, parseNumberFromDots(e.target.value));
                          setFormData({ ...formData, discountValue: formData.type === "PERCENT" ? Math.min(100, val) : val });
                        }}
                        disabled={formData.type === "FREE_SHIPPING"}
                        className="font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Đơn tối thiểu</Label>
                      <Input
                        type="text"
                        value={formatNumberWithDots(formData.minOrderValue)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minOrderValue: Math.max(0, parseNumberFromDots(e.target.value)),
                          })
                        }
                        className="font-bold"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Giảm tối đa</Label>
                      <Input
                        type="text"
                        value={formatNumberWithDots(formData.maxDiscountValue)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDiscountValue: Math.max(0, parseNumberFromDots(e.target.value)),
                          })
                        }
                        className="font-bold"
                        placeholder="Không giới hạn"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ngày bắt đầu *</Label>
                      <Input
                        type="date"
                        value={formData.startAt}
                        min={DATE_MIN}
                        max={DATE_MAX}
                        onChange={(e) =>
                          setFormData({ ...formData, startAt: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ngày kết thúc *</Label>
                      <Input
                        type="date"
                        value={formData.endAt}
                        min={DATE_MIN}
                        max={DATE_MAX}
                        onChange={(e) =>
                          setFormData({ ...formData, endAt: e.target.value })
                        }
                      />
                    </div>
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
              </ScrollArea>
            </TabsContent>

            <TabsContent value="products" className="outline-none mt-0">
              <div className="space-y-4 py-4 px-6 flex flex-col h-[500px] md:h-[600px] max-h-[65vh]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm sản phẩm..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedProductIds.length === allProducts.length) {
                          setSelectedProductIds([]);
                        } else {
                          setSelectedProductIds(allProducts.map((p) => p.id));
                        }
                      }}
                    >
                      {selectedProductIds.length === allProducts.length
                        ? "Bỏ chọn hết"
                        : "Chọn tất cả"}
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Đã chọn {selectedProductIds.length} sản phẩm
                  </div>

                  <ScrollArea className="h-[400px] border rounded-md p-4">
                    <div className="space-y-4">
                      {allProducts
                        .filter((p) =>
                          p.name
                            .toLowerCase()
                            .includes(productSearchTerm.toLowerCase()),
                        )
                        .map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center space-x-3 space-y-0"
                          >
                            <Checkbox
                              id={`p-${product.id}`}
                              checked={selectedProductIds.includes(product.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedProductIds([
                                    ...selectedProductIds,
                                    product.id,
                                  ]);
                                } else {
                                  setSelectedProductIds(
                                    selectedProductIds.filter(
                                      (id) => id !== product.id,
                                    ),
                                  );
                                }
                              }}
                            />
                            <Label
                              htmlFor={`p-${product.id}`}
                              className="flex items-center gap-2 font-normal cursor-pointer flex-1"
                            >
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden border">
                                {product.image && product.image.length > 0 ? (
                                  <img
                                    src={product.image[0]}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Box className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {product.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ID: {product.id} |{" "}
                                  {product.originalPrice?.toLocaleString()}đ
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="px-6 pb-6">
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave}>
                {editingPromotion ? "Cập nhật" : "Thêm mới"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionsManagement;
