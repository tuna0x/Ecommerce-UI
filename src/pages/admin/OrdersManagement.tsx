import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Eye, ChevronDown, Loader2, RefreshCw, Package, Calendar, CheckSquare, Square, History, Printer, X, SearchX, RotateCcw } from "lucide-react";
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
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { getAllOrdersAdminApi, bulkUpdateOrderStatusApi, type OrderRes } from "../../service/orderService";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { DATE_MIN, getTodayStr, isValidDate, clampYear } from "../../lib/date";

// --------- Constants ---------
const STATUS_OPTIONS = [
  { value: "PENDING",   label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800" },
  { value: "CONFIRMED", label: "Đã xác nhận",  color: "bg-blue-100 text-blue-800" },
  { value: "DELIVERING", label: "Đang giao",    color: "bg-purple-100 text-purple-800" },
  { value: "DELIVERED", label: "Đã giao",      color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Đã hủy",       color: "bg-red-100 text-red-800" },
];

const PAYMENT_LABELS: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  VNPAY: "Ví VNPAY",
};

const PAGE_SIZE = 10;

// --------- Helpers ---------
const getStatusConfig = (status: string) =>
  STATUS_OPTIONS.find((s) => s.value === status.toUpperCase()) ?? {
    value: status,
    label: status,
    color: "bg-gray-100 text-gray-700",
  };

const formatCurrency = (value: number | string | null | undefined) => {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
};

const formatDate = (str?: string) => {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// --------- Main Component ---------
const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderRes[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Detail dialog
  const [selectedOrder, setSelectedOrder] = useState<OrderRes | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ---- Fetch ----
  const fetchOrders = useCallback(async (page: number, status: string, start?: string, end?: string) => {
    try {
      if ((start && !isValidDate(start)) || (end && !isValidDate(end))) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Backend expects ISO Strings for Instants
      const startISO = start ? new Date(start).toISOString() : undefined;
      const endISO = end ? new Date(end).toISOString() : undefined;
      
      const res = await getAllOrdersAdminApi(page, PAGE_SIZE, status, startISO, endISO);
      const data = res?.data?.data;
      
      if (data) {
        const result: OrderRes[] = Array.isArray(data.result) ? data.result : [];
        setOrders(result);
        setTotalPages(data.meta?.pages ?? 1);
        setTotalItems(data.meta?.total ?? result.length);
        // Clear selection when page/filter changes
        setSelectedIds(new Set());
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error("Không thể tải danh sách đơn hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchOrders(currentPage, statusFilter, startDate, endDate);
  }, [fetchOrders, currentPage, statusFilter, startDate, endDate]);

  // ---- Client-side search (on top of server-side status filter) ----
  const displayedOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const lower = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        String(o.id).includes(lower) ||
        (o.transactionID ?? "").toLowerCase().includes(lower) ||
        (o.receiverName ?? "").toLowerCase().includes(lower) ||
        (o.user?.name ?? "").toLowerCase().includes(lower) ||
        (o.user?.email ?? "").toLowerCase().includes(lower) ||
        (o.phone ?? "").includes(lower)
    );
  }, [orders, searchTerm]);

  // ---- Bulk Operations ----
  // ---- Bulk Operations ----

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedOrders.map(o => o.id)));
    }
  };

  const toggleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkUpdateStatus = async (newStatus: string, targetIds?: number[]) => {
    const idsToUpdate = targetIds || Array.from(selectedIds);
    if (idsToUpdate.length === 0) return;
    
    try {
      setIsBulkUpdating(true);
      await bulkUpdateOrderStatusApi(idsToUpdate, newStatus);
      
      const idSet = new Set(idsToUpdate);
      setOrders(prev => prev.map(o => 
        idSet.has(o.id) ? { ...o, status: newStatus } : o
      ));
      
      toast.success(`Đã cập nhật ${idsToUpdate.length} đơn hàng sang ${getStatusConfig(newStatus).label}`);
      if (!targetIds) setSelectedIds(new Set());
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Cập nhật thất bại");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const getTotalQuantity = (order: OrderRes) => {
    return (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
  };

  const handlePrintInvoice = (order: OrderRes) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Hoa don #${order.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .invoice-title { font-size: 24px; font-weight: bold; color: #000; }
            .section { margin: 30px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .label { color: #666; font-size: 12px; text-transform: uppercase; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; border-bottom: 1px solid #eee; padding: 10px; font-size: 14px; }
            td { padding: 10px; border-bottom: 1px solid #f9f9f9; font-size: 14px; }
            .total-row { display: flex; justify-content: flex-end; margin-top: 30px; font-size: 18px; font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
              <p>Mã đơn: <strong>#${order.id}</strong></p>
              <p>Ngày đặt: ${formatDate(order.createdAt)}</p>
            </div>
            <div style="text-align: right">
              <h2 style="margin: 0">TUNA ECOMMERCE</h2>
              <p>Hà Nội, Việt Nam</p>
              <p>Email: contact@tuna.com</p>
            </div>
          </div>

          <div class="section grid">
            <div>
              <div class="label">Khách hàng</div>
              <p><strong>${order.user?.name || 'Guest'}</strong></p>
              <p>${order.user?.email || ''}</p>
            </div>
            <div style="text-align: right">
              <div class="label">Người nhận & Địa chỉ</div>
              <p><strong>${order.receiverName}</strong></p>
              <p>${order.phone}</p>
              <p>${order.shippingAddress}, ${order.ward}, ${order.district}, ${order.province}</p>
            </div>
          </div>

          <div class="section">
            <div class="label">Chi tiết sản phẩm</div>
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Số lượng</th>
                  <th style="text-align: right">Đơn giá</th>
                  <th style="text-align: right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${order.items?.map(item => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td style="text-align: right">${formatCurrency(item.price)}</td>
                    <td style="text-align: right">${formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="total-row">
            <div>
              <div style="display: flex; justify-content: space-between; width: 300px; font-weight: normal; font-size: 14px; margin-bottom: 5px;">
                <span>Tạm tính:</span> <span>${formatCurrency(order.subTotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; width: 300px; font-weight: normal; font-size: 14px; margin-bottom: 5px;">
                <span>Phí ship:</span> <span>+${formatCurrency(order.shippingFee)}</span>
              </div>
              ${order.discountPrice ? `
                <div style="display: flex; justify-content: space-between; width: 300px; font-weight: normal; font-size: 14px; color: red; margin-bottom: 5px;">
                  <span>Giảm giá:</span> <span>-${formatCurrency(order.discountPrice)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; width: 300px; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px;">
                <span>Tổng cộng:</span> <span>${formatCurrency(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 100px; text-align: center; color: #999; font-size: 12px;">
            Cảm ơn quý khách đã mua hàng!
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tổng: <span className="font-semibold text-foreground">{totalItems}</span> đơn hàng
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOrders(currentPage, statusFilter)}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex border-b overflow-x-auto no-scrollbar gap-2 p-1 bg-muted/20 rounded-lg">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap",
            statusFilter === "all" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
          )}
        >
          Tất cả
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-2",
              statusFilter === s.value ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {s.label}
            {statusFilter === s.value && totalItems > 0 && (
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px]">
                {totalItems}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Mã đơn, tên, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Từ ngày"
                  value={startDate}
                  min={DATE_MIN}
                  max={getTodayStr()}
                  onChange={(e) => setStartDate(clampYear(e.target.value))}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Đến ngày"
                  value={endDate}
                  min={DATE_MIN}
                  max={getTodayStr()}
                  onChange={(e) => setEndDate(clampYear(e.target.value))}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="h-9 px-3"
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
            </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách đơn hàng
            {searchTerm && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                — {displayedOrders.length} kết quả tìm kiếm
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-lg bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-3 px-4 text-left w-10">
                    <button onClick={toggleSelectAll} className="hover:text-primary transition-colors">
                      {selectedIds.size === displayedOrders.length && displayedOrders.length > 0
                        ? <CheckSquare className="h-4 w-4" />
                        : <Square className="h-4 w-4" />
                      }
                    </button>
                  </th>
                  {["Mã đơn", "Mã giao dịch", "Khách hàng", "Người nhận", "Ngày đặt", "SL", "Tổng tiền", "Trạng thái", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`py-3 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider ${i === 7 ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : displayedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-20 px-4">
                      <div className="flex flex-col items-center justify-center max-w-[200px] mx-auto text-muted-foreground">
                        <div className="relative mb-4">
                           <SearchX className="w-12 h-12 opacity-20" />
                           <Package className="w-6 h-6 absolute -bottom-1 -right-1 text-primary animate-bounce" />
                        </div>
                        <p className="font-semibold text-foreground">Không tìm thấy đơn hàng</p>
                        <p className="text-xs mt-1 text-center font-normal italic">Vui lòng thử lại với từ khóa khác hoặc xóa bộ lọc ngày</p>
                        {searchTerm && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => setSearchTerm("")}
                            className="mt-2 text-primary h-auto p-0"
                          >
                            Xóa tìm kiếm
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedOrders.map((order) => {
                    const cfg = getStatusConfig(order.status);
                    return (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4">
                          <button onClick={() => toggleSelectOne(order.id)} className="hover:text-primary transition-colors">
                            {selectedIds.has(order.id)
                              ? <CheckSquare className="h-4 w-4 text-primary" />
                              : <Square className="h-4 w-4 text-muted-foreground" />
                            }
                          </button>
                        </td>
                        <td className="py-4 px-4 text-sm font-mono font-bold text-primary">
                          #{order.id}
                        </td>
                        <td className="py-4 px-4 text-sm font-mono text-muted-foreground whitespace-nowrap">
                          {order.transactionID || "—"}
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm font-semibold">{order.user?.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{order.user?.email ?? ""}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm font-semibold">{order.receiverName ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{order.phone ?? ""}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-4 px-4 text-sm font-medium">
                          {getTotalQuantity(order)}
                        </td>
                        <td className="py-4 px-4 text-sm font-bold whitespace-nowrap">
                          {formatCurrency(order.totalPrice)}
                        </td>
                        <td className="py-4 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="flex items-center gap-1 hover:opacity-80 transition-opacity outline-none disabled:opacity-50"
                                disabled={isBulkUpdating}
                              >
                                <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                                {isBulkUpdating && selectedIds.has(order.id)
                                  ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                  : <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                }
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {STATUS_OPTIONS.map((s) => (
                                <DropdownMenuItem
                                  key={s.value}
                                  className="text-xs"
                                  disabled={s.value === order.status.toUpperCase()}
                                  onClick={() => handleBulkUpdateStatus(s.value, [order.id])}
                                >
                                  <span className={`w-2 h-2 rounded-full mr-2 inline-block ${s.color.split(" ")[0]}`} />
                                  {s.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Trang <span className="font-bold">{currentPage}</span> / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Trước
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        className="w-9"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  Chi tiết đơn hàng
                  <span className="font-mono text-primary animate-pulse-subtle">
                    #{selectedOrder?.id}
                  </span>
                </div>
                <p className="text-xs font-mono text-muted-foreground font-normal">
                  Mã giao dịch: {selectedOrder?.transactionID || "—"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1 text-xs"
                  onClick={() => handlePrintInvoice(selectedOrder!)}
                >
                  <Printer className="h-3.5 w-3.5" />
                  In hóa đơn
                </Button>
                {selectedOrder?.user?.email && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-100"
                    asChild
                  >
                    <a href={`/admin/user-activities?email=${selectedOrder.user.email}`} target="_blank" rel="noreferrer">
                      <History className="h-3.5 w-3.5" />
                      Hành trình khách
                    </a>
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5 text-sm">
              {/* Order Timeline */}
              <div className="bg-muted/30 p-4 rounded-xl">
                <p className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <Package className="h-3 w-3" /> Trạng thái vận hành
                </p>
                <div className="flex items-start justify-between relative px-2">
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted z-0" />
                  
                  {/* Step 1: Created */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold">Đặt hàng</p>
                      <p className="text-[9px] text-muted-foreground whitespace-nowrap">{formatDate(selectedOrder.createdAt).split(' ')[0]}</p>
                    </div>
                  </div>

                  {/* Step 2: Confirmed */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm",
                      selectedOrder.confirmedAt || selectedOrder.status !== 'PENDING' ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <CheckSquare className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold">Xác nhận</p>
                      <p className="text-[9px] text-muted-foreground whitespace-nowrap">
                        {selectedOrder.confirmedAt ? formatDate(selectedOrder.confirmedAt).split(' ')[0] : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Delivering */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm",
                      ['DELIVERING', 'DELIVERED'].includes(selectedOrder.status) ? "bg-purple-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <RefreshCw className={cn("h-4 w-4", selectedOrder.status === 'DELIVERING' ? "animate-spin-slow" : "")} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold">Đang giao</p>
                      <p className="text-[9px] text-muted-foreground">
                        {selectedOrder.shippingCode ? `#${selectedOrder.shippingCode}` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Delivered */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm",
                      selectedOrder.status === 'DELIVERED' ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold">Hoàn tất</p>
                      <p className="text-[9px] text-muted-foreground">
                        {selectedOrder.deliveredAt ? formatDate(selectedOrder.deliveredAt).split(' ')[0] : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status + Change Status */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`${getStatusConfig(selectedOrder.status).color} border-none text-[11px] font-bold px-3 py-1`}>
                  {getStatusConfig(selectedOrder.status).label}
                </Badge>
                <span className="text-muted-foreground text-xs">Mã ship: {selectedOrder.shippingCode || "Chưa có"}</span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto gap-1 text-xs" disabled={isBulkUpdating}>
                      {isBulkUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronDown className="h-3 w-3" />}
                      Đổi trạng thái
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {STATUS_OPTIONS.map((s) => (
                      <DropdownMenuItem
                        key={s.value}
                        className="text-xs"
                        disabled={s.value === selectedOrder.status.toUpperCase()}
                        onClick={() => handleBulkUpdateStatus(s.value, [selectedOrder.id])}
                      >
                        <span className={`w-2 h-2 rounded-full mr-2 inline-block ${s.color.split(" ")[0]}`} />
                        {s.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-xl space-y-2">
                  <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Tài khoản</p>
                  <p className="flex gap-2"><span className="text-muted-foreground shrink-0">Tên:</span> <span className="font-semibold break-words">{selectedOrder.user?.name ?? "—"}</span></p>
                  <p className="flex gap-2"><span className="text-muted-foreground shrink-0">Email:</span> <span className="break-all">{selectedOrder.user?.email ?? "—"}</span></p>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl space-y-2">
                  <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Người nhận</p>
                  <p className="flex gap-2"><span className="text-muted-foreground shrink-0">Tên:</span> <span className="font-semibold break-words">{selectedOrder.receiverName ?? "—"}</span></p>
                  <p className="flex gap-2"><span className="text-muted-foreground shrink-0">SĐT:</span> <span className="break-words">{selectedOrder.phone ?? "—"}</span></p>
                  <p className="flex gap-2"><span className="text-muted-foreground shrink-0">Địa chỉ:</span> <span className="break-words">{selectedOrder.shippingAddress ?? "—"}</span></p>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-muted/50 p-4 rounded-xl space-y-2">
                <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Thanh toán</p>
                <p><span className="text-muted-foreground">Phương thức:</span> {PAYMENT_LABELS[selectedOrder.paymentMethod] ?? selectedOrder.paymentMethod ?? "—"}</p>
                <p>
                  <span className="text-muted-foreground">Trạng thái:</span>{" "}
                  <span className={`font-bold ${selectedOrder.paymentStatus === "PAID" ? "text-green-600" : "text-orange-500"}`}>
                    {selectedOrder.paymentStatus === "PAID" ? "Đã thanh toán" : "Chờ thanh toán"}
                  </span>
                </p>
              </div>

              {/* Products */}
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Sản phẩm</p>
                <div className="border rounded-xl divide-y overflow-hidden">
                  {(selectedOrder.items ?? []).map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 hover:bg-muted/30 transition-colors">
                      <img
                        src={item.productImage || ""}
                        alt={item.productName}
                        className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold line-clamp-2 leading-snug">{item.productName}</p>
                        <p className="text-xs text-muted-foreground mt-1">x{item.quantity}</p>
                      </div>
                      <p className="font-bold text-sm whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-semibold">Tổng cộng</span>
                <span className="text-xl font-black text-primary">{formatCurrency(selectedOrder.totalPrice)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-6 border border-white/10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 px-2 border-r border-white/10 mr-2">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                {selectedIds.size}
              </span>
              <span className="text-sm font-medium text-gray-300">đã chọn</span>
            </div>

            <Select onValueChange={handleBulkUpdateStatus} disabled={isBulkUpdating}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10 h-9 text-xs">
                <SelectValue placeholder="Đổi trạng thái..." />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-gray-400 hover:text-white hover:bg-white/5"
            >
              Hủy
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersManagement;
