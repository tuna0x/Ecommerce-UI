import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Plus,
  Trash2,
  Search,
  Clock,
  Loader2,
  History,
  Timer,
  ShoppingBag,
  Edit2,
} from "lucide-react";
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
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Checkbox } from "../../components/ui/Checkbox";
import { ScrollArea } from "../../components/ui/scroll-area";
import ConfirmModal from "../../components/ConfirmModal";
import { flashSaleService, type FlashSaleCampaign, type FlashSaleItemRequest } from "../../service/flashSaleService";
import { ProductService } from "../../service/productService";
import type { IProduct } from "../../types/product.type";
import { FlashSaleTimePicker } from "../../components/ui/FlashSaleTimePicker";
import { parseISO, format as formatDF, addDays, isBefore } from "date-fns";
import { formatNumberWithDots, parseNumberFromDots } from "../../lib/numberUtils";
import { cn } from "../../lib/utils";

const FlashSaleManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<FlashSaleCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<IProduct[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startAt: new Date(),
    endAt: addDays(new Date(), 1),
  });

  const [selectedItems, setSelectedItems] = useState<Record<string, { price: number; limit: number; productId: number; variantId?: number }>>({});

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await flashSaleService.getAllCampaigns();
      setCampaigns(data);
    } catch {
      toast.error("Không thể tải danh sách Flash Sale");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await ProductService.getAll(0, 100);
      if (res && res.data && res.data.result) {
        setAllProducts(res.data.result);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchProducts();
  }, [fetchCampaigns]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.startAt || !formData.endAt) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (isBefore(formData.endAt, formData.startAt)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    // Check for overlapping campaigns
    const conflict = campaigns.find(c => {
      if (isEditing && c.id === editId) return false;
      if (!c.active) return false;
      
      const cStart = new Date(c.startAt);
      const cEnd = new Date(c.endAt);
      
      // Conflict if (StartA < EndB) AND (EndA > StartB)
      return (formData.startAt < cEnd && formData.endAt > cStart);
    });

    if (conflict) {
      toast.error(`Khung giờ này bị trùng với chiến dịch: ${conflict.name}`);
      return;
    }

    const itemKeys = Object.keys(selectedItems);
    if (itemKeys.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }

    try {
      const campaignItems: FlashSaleItemRequest[] = itemKeys.map(key => {
        const item = selectedItems[key];
        const product = allProducts.find(p => p.id === item.productId);
        
        if (!product) {
          throw new Error("Không tìm thấy thông tin sản phẩm");
        }

        let basePrice = product.originalPrice;
        if (item.variantId) {
          const variant = product.variants?.find(v => v.id === item.variantId);
          if (variant && variant.price && variant.price > 0) {
            basePrice = variant.price;
          }
        }

        if (item.price < 0) {
          throw new Error(`Giá Flash Sale của sản phẩm ${product.name} không được âm`);
        }
        
        if (item.price >= basePrice) {
          throw new Error(`Giá Flash Sale của sản phẩm ${product.name} phải nhỏ hơn giá gốc (${formatNumberWithDots(basePrice)}đ)`);
        }

        if (item.limit <= 0) {
          throw new Error(`Số lượng Sale của sản phẩm ${product.name} phải lớn hơn 0`);
        }

        // Stock validation
        let availableStock = product.stock;
        if (item.variantId) {
            const v = product.variants?.find(v => v.id === item.variantId);
            if (v) availableStock = v.stock;
        }

        if (item.limit > availableStock) {
            throw new Error(`Số lượng Flash Sale cho ${product.name}${item.variantId ? ' (biến thể)' : ''} vượt quá tồn kho hiện có (${availableStock})`);
        }

        return {
          productId: item.productId,
          variantId: item.variantId,
          flashSalePrice: item.price,
          limitQuantity: item.limit,
        };
      });

      setIsLoading(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        // Format to yyyy-MM-dd'T'HH:mm:ss for Spring Boot
        startAt: formatDF(formData.startAt, "yyyy-MM-dd'T'HH:mm:ss"),
        endAt: formatDF(formData.endAt, "yyyy-MM-dd'T'HH:mm:ss"),
        items: campaignItems
      };

      if (isEditing && editId) {
        await flashSaleService.updateCampaign(editId, payload);
        toast.success("Cập nhật chiến dịch Flash Sale thành công");
      } else {
        await flashSaleService.createCampaign(payload);
        toast.success("Đã tạo chiến dịch Flash Sale thành công");
      }
      setIsDialogOpen(false);
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message || (isEditing ? "Lỗi khi cập nhật Flash Sale" : "Lỗi khi tạo Flash Sale"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await flashSaleService.deleteCampaign(id);
      toast.success("Đã xóa chiến dịch");
      fetchCampaigns();
    } catch {
      toast.error("Không thể xóa chiến dịch");
    }
  };

  const handleEdit = (campaign: FlashSaleCampaign) => {
    setIsEditing(true);
    setEditId(campaign.id);
    
    setFormData({
      name: campaign.name,
      description: campaign.description,
      startAt: parseISO(campaign.startAt),
      endAt: parseISO(campaign.endAt),
    });

    const items: Record<string, { price: number; limit: number; productId: number; variantId?: number }> = {};
    campaign.items.forEach(item => {
      const key = item.variantId ? `v${item.variantId}` : `p${item.productId}`;
      items[key] = {
        productId: item.productId,
        variantId: item.variantId,
        price: item.flashSalePrice,
        limit: item.limitQuantity
      };
    });
    setSelectedItems(items);
    setIsDialogOpen(true);
  };

  const getCampaignStatus = (campaign: FlashSaleCampaign) => {
    const now = new Date();
    const start = new Date(campaign.startAt);
    const end = new Date(campaign.endAt);

    if (now < start) return { label: "Sắp diễn ra", color: "bg-blue-100 text-blue-700", icon: Clock };
    if (now > end) return { label: "Đã kết thúc", color: "bg-slate-100 text-slate-500", icon: History };
    return { label: "Đang diễn ra", color: "bg-green-100 text-green-700", icon: Timer };
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [campaigns, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Chiến dịch Flash Sale</h1>
          <p className="text-sm text-muted-foreground">Quản lý các đợt mở bán chớp nhoáng theo khung giờ</p>
        </div>
        <Button onClick={() => {
            setIsEditing(false);
            setEditId(null);
            setFormData({ 
              name: "", 
              description: "", 
              startAt: new Date(), 
              endAt: addDays(new Date(), 1) 
            });
            setSelectedItems({});
            setIsDialogOpen(true);
        }} className="bg-pink-600 hover:bg-pink-700 shadow-md transition-all active:scale-95 whitespace-nowrap">
          <Plus className="mr-2 h-4 w-4" /> Tạo đợt Sale mới
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm đợt sale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 sm:h-9"
          />
        </div>
      </div>

      <div className="relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden sm:block border rounded-lg overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[30%]">Tên chiến dịch</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead className="w-[15%]">Sản phẩm</TableHead>
                <TableHead className="w-[15%] text-center">Trạng thái</TableHead>
                <TableHead className="text-right w-[100px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-muted-foreground italic">
                    Chưa có chiến dịch nào được khởi tạo
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((c) => {
                  const status = getCampaignStatus(c);
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={c.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-bold text-sm text-foreground group-hover:text-pink-600 transition-colors">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{c.description || "Không có mô tả"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[11px] space-y-0.5 font-medium">
                          <div className="text-blue-600 flex items-center gap-1.5">
                            <span className="w-5 text-[9px] text-muted-foreground font-bold">BĐ:</span>
                            {c.startAt.replace('T', ' ')}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1.5">
                            <span className="w-5 text-[9px] text-muted-foreground font-bold">KT:</span>
                            {c.endAt.replace('T', ' ')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1.5 bg-muted/80 font-bold border-none">
                          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.items.length} SP
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("gap-1.5 border-none shadow-none px-3 py-1", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600" onClick={() => handleEdit(c)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <ConfirmModal
                            title="Xác nhận xóa"
                            description={`Bạn có chắc muốn xóa vĩnh viễn đợt sale "${c.name}"?`}
                            onConfirm={() => handleDelete(c.id)}
                            variant="destructive"
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ConfirmModal>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-4">
          {filteredCampaigns.length === 0 && !isLoading ? (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed text-muted-foreground italic text-sm">
              Chưa có chiến dịch Flash Sale nào
            </div>
          ) : (
            filteredCampaigns.map((c) => {
              const status = getCampaignStatus(c);
              const StatusIcon = status.icon;
              return (
                <div key={c.id} className="p-4 rounded-xl border bg-card shadow-sm space-y-3 active:scale-[0.98] transition-all border-l-4 border-l-pink-500">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="font-extrabold text-sm truncate uppercase tracking-tight">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {c.description || "Không có mô tả chi tiết cho đợt sale này."}
                      </div>
                    </div>
                    <Badge className={cn("shrink-0 gap-1.5 border-none px-2 py-0.5 text-[10px]", status.color)}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {status.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-dashed">
                    <div className="space-y-0.5">
                      <div className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Bắt đầu</div>
                      <div className="text-[10px] font-bold text-blue-600">{c.startAt.split('T')[0]}</div>
                      <div className="text-[12px] font-black">{c.startAt.split('T')[1]}</div>
                    </div>
                    <div className="space-y-0.5 border-l pl-3">
                      <div className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Kết thúc</div>
                      <div className="text-[10px] font-bold text-muted-foreground">{c.endAt.split('T')[0]}</div>
                      <div className="text-[12px] font-black">{c.endAt.split('T')[1]}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-muted text-[10px] font-bold py-1">
                      <ShoppingBag className="h-3 w-3 mr-1.5" />
                      {c.items.length} sản phẩm áp dụng
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg text-blue-600 border-blue-100 hover:bg-blue-50" onClick={() => handleEdit(c)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <ConfirmModal
                        title="Xác nhận xóa"
                        description={`Xóa đợt sale "${c.name}"?`}
                        onConfirm={() => handleDelete(c.id)}
                        variant="destructive"
                      >
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg text-destructive border-red-100 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </ConfirmModal>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col p-0 overflow-hidden text-sm rounded-xl border border-border shadow-2xl">
          <DialogHeader className="p-4 sm:p-6 pb-2">
            <DialogTitle>{isEditing ? "Cập nhật Flash Sale" : "Tạo đợt Flash Sale mới"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {isEditing ? "Thay đổi khung giờ hoặc điều chỉnh sản phẩm đang tham gia sale." : "Chọn khung giờ và cài đặt giá sốc cho sản phẩm của bạn."}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-3 sm:px-6 w-full max-w-full">
            <div className="space-y-3 py-1 w-full max-w-full overflow-x-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <Label>Tên đợt Sale *</Label>
                  <Input 
                    placeholder="VD: Flash Sale Giờ Vàng 12h" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1 w-full min-w-0">
                  <Label className="text-xs font-bold">Mô tả ngắn</Label>
                  <Input 
                    className="h-10 sm:h-9 w-full"
                    placeholder="Săn deal đồng giá..." 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <FlashSaleTimePicker 
                  startDate={formData.startAt}
                  endDate={formData.endAt}
                  onChange={(start, end) => setFormData({ ...formData, startAt: start, endAt: end })}
                />
              </div>

              <div className="space-y-3 pt-3 border-t">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <Label className="text-sm font-bold">Sản phẩm áp dụng ({Object.keys(selectedItems).length})</Label>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-9 h-10 sm:h-8 text-[13px] sm:text-xs" 
                      placeholder="Tìm SP nhanh..." 
                      value={productSearchTerm}
                      onChange={e => setProductSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2 max-h-[300px]">
                    {allProducts
                    .filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
                    .map(p => {
                      const hasVariants = p.variants && p.variants.length > 0;
                      const selectedVariantCount = p.variants?.filter(v => !!selectedItems[`v${v.id}`]).length || 0;
                      const isAllVariantsSelected = hasVariants && selectedVariantCount === p.variants?.length;
                      
                      return (
                        <div key={p.id} className="space-y-2 w-full min-w-0">
                           <div className={cn(
                             "flex items-start gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg border transition-all w-full min-w-0",
                             (!hasVariants && !!selectedItems[`p${p.id}`]) || (hasVariants && selectedVariantCount > 0) 
                              ? "bg-primary/5 border-primary shadow-sm" : "bg-card border-border"
                           )}>
                             <div className="pt-1">
                               <Checkbox 
                                 checked={hasVariants ? isAllVariantsSelected : !!selectedItems[`p${p.id}`]}
                                 // indeterminate property is usually handled by ref or a specific UI library prop
                                 // For now we use the checked state to represent full selection
                                 onCheckedChange={(checked) => {
                                   if (hasVariants) {
                                      const next = { ...selectedItems };
                                      p.variants?.forEach(v => {
                                        if (checked) {
                                          next[`v${v.id}`] = { 
                                            price: v.finalPrice || v.price || p.originalPrice || 0, 
                                            limit: 10, 
                                            productId: p.id, 
                                            variantId: v.id 
                                          };
                                        } else {
                                          delete next[`v${v.id}`];
                                        }
                                      });
                                      setSelectedItems(next);
                                   } else {
                                      if (checked) {
                                        setSelectedItems({
                                          ...selectedItems,
                                          [`p${p.id}`]: { price: p.finalPrice || p.originalPrice || 0, limit: 10, productId: p.id }
                                        });
                                      } else {
                                        const next = { ...selectedItems };
                                        delete next[`p${p.id}`];
                                        setSelectedItems(next);
                                      }
                                   }
                                 }}
                               />
                             </div>
                             <img src={(typeof p.image === 'string' ? p.image : p.image?.[0]) || '/placeholder.png'} className="h-12 w-12 rounded object-cover" />
                             <div className="flex-1 min-w-0">
                               <p className="font-medium text-sm truncate">{p.name}</p>
                               <p className="text-xs text-muted-foreground">
                                 {hasVariants ? `${p.variants?.length} phiên bản (${selectedVariantCount} đã chọn)` : `Giá gốc: ${formatNumberWithDots(p.originalPrice)}đ`}
                               </p>
                               
                               {!hasVariants && !!selectedItems[`p${p.id}`] && (
                                   <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                     <div className="space-y-1">
                                       <Label className="text-[10px] uppercase font-bold text-primary">Giá Flash Sale</Label>
                                       <div className="relative">
                                         <Input 
                                           className={cn(
                                             "h-8 text-xs font-bold pl-7",
                                             (selectedItems[`p${p.id}`].price >= p.originalPrice || selectedItems[`p${p.id}`].price < 0) && "border-red-500 bg-red-50"
                                           )}
                                           value={formatNumberWithDots(selectedItems[`p${p.id}`].price)}
                                           onChange={e => setSelectedItems({
                                             ...selectedItems,
                                             [`p${p.id}`]: { ...selectedItems[`p${p.id}`], price: parseNumberFromDots(e.target.value) }
                                           })}
                                         />
                                         <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">đ</span>
                                       </div>
                                       {selectedItems[`p${p.id}`].price >= p.originalPrice && (
                                         <p className="text-[10px] text-red-500 font-medium">Phải nhỏ hơn {formatNumberWithDots(p.originalPrice)}đ</p>
                                       )}
                                     </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px] uppercase font-bold text-orange-600">
                                        Số suất (Kho) <span className="text-muted-foreground ml-1 font-normal lowercase">(Tồn: {p.stock})</span>
                                      </Label>
                                      <Input 
                                        className={cn(
                                          "h-8 text-xs font-bold",
                                          selectedItems[`p${p.id}`].limit > p.stock && "border-red-500 bg-red-50"
                                        )}
                                        type="number"
                                        value={selectedItems[`p${p.id}`].limit}
                                        onChange={e => setSelectedItems({
                                          ...selectedItems,
                                          [`p${p.id}`]: { ...selectedItems[`p${p.id}`], limit: parseInt(e.target.value) || 0 }
                                        })}
                                      />
                                      {selectedItems[`p${p.id}`].limit > p.stock && (
                                        <p className="text-[9px] text-red-500 font-medium">Vượt quá tồn kho ({p.stock})</p>
                                      )}
                                    </div>
                                 </div>
                               )}
                             </div>
                           </div>

                           {/* Variants List */}
                           {hasVariants && (
                             <div className="ml-2 sm:ml-10 space-y-2 border-l-2 border-dashed pl-3 sm:pl-4 py-2">
                               {p.variants?.map(v => {
                                 const vKey = `v${v.id}`;
                                 const isVSelected = !!selectedItems[vKey];
                                 const basePrice = (v.price && v.price > 0) ? v.price : p.originalPrice;
                                 
                                 return (
                                    <div key={v.id} className={cn(
                                      "flex items-start gap-2 sm:gap-4 p-2 rounded-md border text-sm w-full min-w-0",
                                      isVSelected ? "bg-orange-50/50 border-orange-200" : "bg-muted/30 border-transparent"
                                    )}>
                                      <Checkbox 
                                        checked={isVSelected}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedItems({
                                              ...selectedItems,
                                              [vKey]: { price: v.finalPrice || basePrice, limit: 10, productId: p.id, variantId: v.id }
                                            });
                                          } else {
                                            const next = { ...selectedItems };
                                            delete next[vKey];
                                            setSelectedItems(next);
                                          }
                                        }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                                          <span className="font-medium truncate w-full sm:w-auto">{v.variantAttributes.map(a => a.attributeValue).join(' - ')}</span>
                                          <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{formatNumberWithDots(basePrice)}đ</span>
                                        </div>
                                        {isVSelected && (
                                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                              <div className="relative">
                                                <Input 
                                                  className={cn(
                                                    "h-7 text-[10px] font-bold pl-6",
                                                    (selectedItems[vKey].price >= basePrice || selectedItems[vKey].price < 0) && "border-red-500 bg-red-50"
                                                  )} 
                                                  value={formatNumberWithDots(selectedItems[vKey].price)}
                                                  onChange={e => setSelectedItems({
                                                    ...selectedItems,
                                                    [vKey]: { ...selectedItems[vKey], price: parseNumberFromDots(e.target.value) }
                                                  })}
                                                />
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">đ</span>
                                              </div>
                                              {selectedItems[vKey].price >= basePrice && (
                                                <p className="text-[9px] text-red-500 font-medium">Phải nhỏ hơn {formatNumberWithDots(basePrice)}đ</p>
                                              )}
                                            </div>
                                            <div className="space-y-1 flex-1">
                                               <div className="relative">
                                                 <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground font-bold">SL:</span>
                                                 <Input 
                                                   className={cn(
                                                     "h-7 text-[10px] font-bold pl-8",
                                                     selectedItems[vKey].limit > v.stock && "border-red-500 bg-red-50"
                                                   )} 
                                                   type="number"
                                                   value={selectedItems[vKey].limit}
                                                   onChange={e => setSelectedItems({
                                                     ...selectedItems,
                                                     [vKey]: { ...selectedItems[vKey], limit: parseInt(e.target.value) || 0 }
                                                   })}
                                                 />
                                                 <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground italic">/ Tồn: {v.stock}</span>
                                               </div>
                                               {selectedItems[vKey].limit > v.stock && (
                                                 <p className="text-[8px] text-red-500 font-medium mt-0.5">Vượt quá tồn kho</p>
                                               )}
                                             </div>
                                          </div>
                                        )}
                                      </div>
                                   </div>
                                 );
                               })}
                             </div>
                           )}
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 pt-2 border-t bg-muted/20">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Lưu thay đổi" : "Xác nhận tạo Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlashSaleManagement;
