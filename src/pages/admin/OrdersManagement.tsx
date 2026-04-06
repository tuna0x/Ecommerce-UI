import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Eye, ChevronDown, Loader2, RefreshCw, Package } from "lucide-react";
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
import { getAllOrdersAdminApi, updateOrderStatusApi, type OrderRes } from "../../service/orderService";

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
  const [updating, setUpdating] = useState<number | null>(null);

  // Filters & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Detail dialog
  const [selectedOrder, setSelectedOrder] = useState<OrderRes | null>(null);

  // ---- Fetch ----
  const fetchOrders = useCallback(async (page: number, status: string) => {
    try {
      setLoading(true);
      const res = await getAllOrdersAdminApi(page, PAGE_SIZE, status);
      const data = res?.data?.data;
      
      if (data) {
        const result: OrderRes[] = Array.isArray(data.result) ? data.result : [];
        setOrders(result);
        setTotalPages(data.meta?.pages ?? 1);
        setTotalItems(data.meta?.total ?? result.length);
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
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders(currentPage, statusFilter);
  }, [fetchOrders, currentPage, statusFilter]);

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

  // ---- Update status ----
  const handleUpdateStatus = useCallback(async (orderId: number, newStatus: string) => {
    try {
      setUpdating(orderId);
      await updateOrderStatusApi(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
      }
      toast.success(`Đã cập nhật trạng thái đơn #${orderId}`);
    } catch {
      toast.error("Cập nhật trạng thái thất bại");
    } finally {
      setUpdating(null);
    }
  }, [selectedOrder]);

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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã đơn, tên, email, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  {["Mã đơn", "Khách hàng", "Người nhận", "Ngày đặt", "Tổng tiền", "Trạng thái", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`py-3 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider ${i === 6 ? "text-right" : "text-left"}`}
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
                    <td colSpan={7} className="text-center py-20 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="italic">Không có đơn hàng nào</p>
                    </td>
                  </tr>
                ) : (
                  displayedOrders.map((order) => {
                    const cfg = getStatusConfig(order.status);
                    return (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4 text-sm font-mono font-bold text-primary">
                          #{order.transactionID || order.id}
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
                        <td className="py-4 px-4 text-sm font-bold whitespace-nowrap">
                          {formatCurrency(order.totalPrice)}
                        </td>
                        <td className="py-4 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="flex items-center gap-1 hover:opacity-80 transition-opacity outline-none disabled:opacity-50"
                                disabled={updating === order.id}
                              >
                                <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                                {updating === order.id
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
                                  onClick={() => handleUpdateStatus(order.id, s.value)}
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
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Chi tiết đơn hàng
              <span className="font-mono text-primary text-base">
                #{selectedOrder?.transactionID || selectedOrder?.id}
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5 text-sm">
              {/* Status + Date */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`${getStatusConfig(selectedOrder.status).color} border-none text-[11px] font-bold px-3 py-1`}>
                  {getStatusConfig(selectedOrder.status).label}
                </Badge>
                <span className="text-muted-foreground text-xs">{formatDate(selectedOrder.createdAt)}</span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto gap-1 text-xs" disabled={!!updating}>
                      {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronDown className="h-3 w-3" />}
                      Đổi trạng thái
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {STATUS_OPTIONS.map((s) => (
                      <DropdownMenuItem
                        key={s.value}
                        className="text-xs"
                        disabled={s.value === selectedOrder.status.toUpperCase()}
                        onClick={() => handleUpdateStatus(selectedOrder.id, s.value)}
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
                  <p><span className="text-muted-foreground">Tên:</span> <span className="font-semibold">{selectedOrder.user?.name ?? "—"}</span></p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedOrder.user?.email ?? "—"}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl space-y-2">
                  <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Người nhận</p>
                  <p><span className="text-muted-foreground">Tên:</span> <span className="font-semibold">{selectedOrder.receiverName ?? "—"}</span></p>
                  <p><span className="text-muted-foreground">SĐT:</span> {selectedOrder.phone ?? "—"}</p>
                  <p><span className="text-muted-foreground">Địa chỉ:</span> {selectedOrder.shippingAddress ?? "—"}</p>
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
                        <p className="font-semibold truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
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
    </div>
  );
};

export default OrdersManagement;
