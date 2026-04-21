import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  ShoppingBag,
  Truck,
  Clock,
  Check,
  X,
  Eye,
  MapPin,
  Phone,
  CreditCard,
  Loader2,
  Package,
  AlertCircle,
} from "lucide-react";
import { getMyOrdersApi, cancelOrderApi, type OrderRes } from "../service/orderService";
import { useToast } from "../hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Input } from "../components/ui/input";
import OrderTrackingTimeline from "../components/OrderTrackingTimeline";

const statusConfig = {
  PENDING: {
    label: "Chờ xác nhận",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-800",
    icon: Check,
  },
  DELIVERING: {
    label: "Đang giao",
    color: "bg-purple-100 text-purple-800",
    icon: Truck,
  },
  DELIVERED: {
    label: "Đã giao",
    color: "bg-green-100 text-green-800",
    icon: Check,
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800",
    icon: X,
  },
};

const paymentMethodLabels: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  VNPAY: "Ví VNPAY",
  MOMO: "Ví MoMo",
  BANKING: "Chuyển khoản"
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PAID: {
    label: "ĐÃ THANH TOÁN",
    color: "text-green-600 bg-green-50",
  },
  UNPAID: {
    label: "CHỜ THANH TOÁN",
    color: "text-orange-600 bg-orange-50",
  },
};

const CANCEL_REASONS = [
  "Tôi muốn đổi sản phẩm khác",
  "Tôi tìm thấy giá tốt hơn ở nơi khác",
  "Thông tin nhận hàng bị sai",
  "Thời gian giao hàng quá lâu",
  "Tôi đổi ý, không muốn mua nữa",
  "Lý do khác",
];

// --- Optimized OrderCard (Memoized & External) ---
interface OrderCardProps {
  order: OrderRes;
  onViewDetail: (order: OrderRes) => void;
  onCancel: (order: OrderRes) => void;
  formatPrice: (price: string | number | null | undefined) => string;
  formatDate: (date?: string) => string;
}

const OrderCard = memo(({ order, onViewDetail, onCancel, formatPrice, formatDate }: OrderCardProps) => {
  const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = config.icon || Package;

  return (
    <Card className="mb-4 overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-[box-shadow] duration-300 rounded-2xl">
      <CardContent className="p-0 text-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-bold text-pink-600">#{order.transactionID || order.id || "N/A"}</span>
              <Badge variant="outline" className={`${config.color} border-current font-bold px-3 py-0.5 rounded-full text-[10px] uppercase tracking-wide`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold mb-4">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(order.createdAt)}</span>
            </div>

            <div className="space-y-3">
              {(order.items || []).slice(0, 2).map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <img
                    src={item.productImage || ""}
                    alt={item.productName || "Sản phẩm"}
                    className="w-16 h-16 rounded-xl object-cover border border-gray-100 bg-gray-50 flex-shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-gray-900 leading-tight">
                      {item.productName || "Sản phẩm lỗi"}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold bg-gray-100 w-fit px-2 py-0.5 rounded uppercase tracking-tighter">
                      x{item.quantity || 0}
                    </p>
                  </div>
                </div>
              ))}
              {(order.items?.length || 0) > 2 && (
                <p className="text-xs text-pink-600 font-bold px-1 pt-1 italic decoration-pink-100">
                  +{(order.items?.length || 0) - 2} sản phẩm khác
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 self-center md:self-auto min-w-[150px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8 w-full md:w-auto">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Thành tiền</p>
              <p className="text-2xl font-black text-pink-600">
                {formatPrice(order.totalPrice || 0)}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-6 hover:bg-pink-600 hover:text-white hover:border-pink-600 transition-[background-color,border-color,color,transform] duration-200 font-bold border-pink-200 text-pink-600 h-10 shadow-sm active:scale-95 w-full"
                onClick={() => onViewDetail(order)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Chi tiết
              </Button>
              {(order.status === 'PENDING' || (order.status === 'CONFIRMED' && order.paymentMethod === 'VNPAY')) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-6 text-red-500 hover:text-red-700 hover:bg-red-50 font-bold h-10 transition-colors duration-200 w-full"
                  onClick={() => onCancel(order)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Hủy đơn
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

OrderCard.displayName = "OrderCard";

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderRes | null>(null);

  // Cancel order state
  const [cancelOrder, setCancelOrder] = useState<OrderRes | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyOrdersApi(1, 20);

      let dataArray: OrderRes[] = [];
      if (res && res.data) {
        if (res.data.data && Array.isArray(res.data.data.result)) {
          dataArray = res.data.data.result;
        } else if (res.data.result && Array.isArray(res.data.result)) {
          dataArray = res.data.result;
        } else if (Array.isArray(res.data)) {
          dataArray = res.data;
        }
      }
      setOrders(dataArray);

    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [user, navigate, fetchOrders]);

  const formatPrice = useCallback((price: string | number | null | undefined) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (numPrice === null || numPrice === undefined || isNaN(numPrice as number)) return "0 ₫";

    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(numPrice as number);
  }, []);

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "Đang cập nhật...";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  }, []);

  const handleViewDetail = useCallback((order: OrderRes) => {
    setSelectedOrder(order);
  }, []);

  const handleCancelClick = useCallback((order: OrderRes) => {
    setCancelOrder(order);
  }, []);

  const filteredOrders = useMemo(() => {
    const currentOrders = Array.isArray(orders) ? orders : [];
    return {
      all: currentOrders,
      PENDING: currentOrders.filter((o) => o.status === "PENDING"),
      DELIVERING: currentOrders.filter((o) => o.status === "DELIVERING"),
      DELIVERED: currentOrders.filter((o) => o.status === "DELIVERED"),
      CANCELLED: currentOrders.filter((o) => o.status === "CANCELLED"),
    };
  }, [orders]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">

      <main className="flex-1 container mx-auto px-4 py-8 pb-24 md:pb-12 max-w-5xl">
        {/* COSMETICury Page Header */}
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-pink-50 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110 opacity-60 pointer-events-none" />
          <div className="flex items-center gap-7 relative z-10">
            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center border border-pink-50 shadow-inner">
              <ShoppingBag className="w-8 h-8 text-pink-600" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none mb-1">ĐƠN HÀNG</h1>
              <p className="text-gray-400 font-bold text-sm tracking-widest uppercase">Lịch sử và trạng thái mua sắm</p>
            </div>
          </div>
          <Link to="/" className="text-pink-600 font-black hover:bg-pink-50 self-start md:self-auto rounded-2xl px-7 py-7 border-2 border-pink-50 hover:border-pink-200 transition-[background-color,border-color,transform] duration-200 tracking-widest text-xs uppercase active:scale-95 inline-flex items-center">
            MUA SẮM THÊM <Truck className="ml-3 w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Loader2 className="w-12 h-12 animate-spin text-pink-600 mb-6" />
            <p className="text-lg font-black tracking-[0.2em] uppercase text-gray-300">Đang tải lịch sử...</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-10 inline-flex w-full overflow-x-auto no-scrollbar">
              <TabsList className="bg-transparent h-auto gap-2 p-0 w-full justify-start md:justify-around text-sans">
                <TabsTrigger value="all" className="rounded-xl px-5 py-3 data-[state=active]:bg-pink-600 data-[state=active]:text-white font-black transition-[background-color,color] duration-200 text-[11px] uppercase tracking-wider shadow-none outline-none">
                  Tất cả ({filteredOrders.all.length})
                </TabsTrigger>
                <TabsTrigger value="PENDING" className="rounded-xl px-5 py-3 data-[state=active]:bg-pink-600 data-[state=active]:text-white font-black transition-[background-color,color] duration-200 text-[11px] uppercase tracking-wider shadow-none outline-none">
                  Chờ xác nhận ({filteredOrders.PENDING.length})
                </TabsTrigger>
                <TabsTrigger value="DELIVERING" className="rounded-xl px-5 py-3 data-[state=active]:bg-pink-600 data-[state=active]:text-white font-black transition-[background-color,color] duration-200 text-[11px] uppercase tracking-wider shadow-none outline-none">
                  Đang giao ({filteredOrders.DELIVERING.length})
                </TabsTrigger>
                <TabsTrigger value="DELIVERED" className="rounded-xl px-5 py-3 data-[state=active]:bg-pink-600 data-[state=active]:text-white font-black transition-[background-color,color] duration-200 text-[11px] uppercase tracking-wider shadow-none outline-none">
                  Đã giao ({filteredOrders.DELIVERED.length})
                </TabsTrigger>
                <TabsTrigger value="CANCELLED" className="rounded-xl px-5 py-3 data-[state=active]:bg-pink-600 data-[state=active]:text-white font-black transition-[background-color,color] duration-200 text-[11px] uppercase tracking-wider shadow-none outline-none">
                  Đã hủy ({filteredOrders.CANCELLED.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {["all", "PENDING", "DELIVERING", "DELIVERED", "CANCELLED"].map(
              (status) => (
                <TabsContent key={status} value={status} className="mt-0 outline-none">
                  {(filteredOrders[status as keyof typeof filteredOrders] || filteredOrders.all).length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-24 text-center border border-gray-100 shadow-sm">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <ShoppingBag className="w-12 h-12 text-gray-200" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-widest">Trống dữ liệu</h3>
                      <p className="text-gray-400 font-bold max-w-xs mx-auto italic text-sm">
                        Hiện chưa có đơn hàng nào trong danh mục này.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-5">
                      {(filteredOrders[status as keyof typeof filteredOrders] || filteredOrders.all).map(
                        (order: OrderRes) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            onViewDetail={handleViewDetail}
                            onCancel={handleCancelClick}
                            formatPrice={formatPrice}
                            formatDate={formatDate}
                          />
                        ),
                      )}
                    </div>
                  )}
                </TabsContent>
              ),
            )}
          </Tabs>
        )}
      </main>

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        order={cancelOrder}
        onClose={() => setCancelOrder(null)}
        onSuccess={() => {
          setCancelOrder(null);
          fetchOrders();
        }}
      />

      {/* Order Detail Dialog - BORDERLESS COSMETICURY REFINEMENT */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-none shadow-2xl bg-white [&>button]:text-white [&>button]:opacity-100 [&>button]:scale-125 [&>button]:hover:bg-white/20 [&>button]:top-5 [&>button]:right-5 [&>button]:transition-[background-color,transform] [&>button]:duration-200 [&>button]:z-50 [&>button]:focus:ring-0 [&>button]:focus:ring-offset-0 [&>button]:outline-none">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 md:p-8 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-full bg-pink-600/10 skew-x-[-20deg] translate-x-12 blur-lg pointer-events-none" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl md:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-100">
                Chi tiết đơn hàng
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-pink-400 font-black text-[10px] uppercase tracking-[0.2em] opacity-80">Mã giao dịch:</span>
                <span className="text-white font-mono font-bold text-sm bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                  #{selectedOrder?.transactionID || selectedOrder?.id || "N/A"}
                </span>
              </div>
            </DialogHeader>

            <div className="hidden md:flex w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-700 rounded-2xl items-center justify-center border border-white/20 shadow-xl relative z-10 rotate-3">
              <Package className="w-9 h-9 text-white" />
            </div>
          </div>

          {selectedOrder && (
            <div className="p-6 md:p-10 space-y-6 bg-white pt-0">
              {/* Timeline Section */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 -mt-4 shadow-sm">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  TRẠNG THÁI HÀNH TRÌNH <span className="w-8 h-px bg-gray-100" />
                </p>
                <OrderTrackingTimeline 
                   status={selectedOrder.status}
                   createdAt={selectedOrder.createdAt}
                   confirmedAt={selectedOrder.confirmedAt}
                   deliveredAt={selectedOrder.deliveredAt}
                   shippingCode={selectedOrder.shippingCode}
                />
              </div>

              {/* Shipping Info - BORDERLESS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-none bg-gray-50/50 rounded-2xl overflow-hidden group hover:bg-white hover:shadow-md transition-[box-shadow,background-color] duration-300">
                  <CardHeader className="py-3 px-5 border-none bg-white/80 transition-colors duration-300 group-hover:bg-pink-50/30">
                    <CardTitle className="text-sm flex items-center gap-2 font-black uppercase tracking-widest text-gray-900">
                      <MapPin className="w-4 h-4 text-pink-500" />
                      Người nhận
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Tên đầy đủ</p>
                      <p className="text-sm font-black text-gray-900">{selectedOrder.receiverName || selectedOrder.user?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Số điện thoại</p>
                      <p className="text-sm font-black text-pink-600 flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {selectedOrder.phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Địa chỉ giao hàng</p>
                      <p className="text-xs text-gray-600 font-bold leading-relaxed">
                        {selectedOrder.shippingAddress && `${selectedOrder.shippingAddress}, `}
                        {selectedOrder.ward && `${selectedOrder.ward}, `}
                        {selectedOrder.district && `${selectedOrder.district}, `}
                        {selectedOrder.province || "Chưa cập nhật địa chỉ"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-none bg-gray-50/50 rounded-2xl overflow-hidden group hover:bg-white hover:shadow-md transition-[box-shadow,background-color] duration-300">
                  <CardHeader className="py-3 px-5 border-none bg-white/80 transition-colors duration-300 group-hover:bg-pink-50/30">
                    <CardTitle className="text-sm flex items-center gap-2 font-black uppercase tracking-widest text-gray-900">
                      <CreditCard className="w-4 h-4 text-pink-500" />
                      Thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Phương thức</p>
                      <p className="text-[11px] font-black text-gray-800 bg-white w-fit px-3 py-1 rounded-lg shadow-sm uppercase">
                        {paymentMethodLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod || "COD"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Tình trạng</p>
                      <Badge 
                        variant="outline" 
                        className={`font-black px-4 py-1 rounded-full text-[10px] tracking-tighter border-none outline-none ${(paymentStatusConfig[selectedOrder.paymentStatus] || paymentStatusConfig.UNPAID).color}`}
                      >
                        {(paymentStatusConfig[selectedOrder.paymentStatus] || paymentStatusConfig.UNPAID).label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Products List - BORDERLESS TABLE STYLE */}
              <div className="space-y-4 pt-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  SẢN PHẨM <span className="w-8 h-px bg-gray-100" />
                </h4>
                <div className="bg-gray-50 rounded-2xl border-none overflow-hidden divide-y divide-gray-100">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-5 p-5 hover:bg-white transition-colors duration-200"
                    >
                      <img
                        src={item.productImage || ""}
                        alt={item.productName || "Product"}
                        className="w-16 h-16 rounded-xl object-cover border-none bg-white shadow-sm flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 tracking-tight leading-tight">{item.productName || "Sản phẩm không rõ tên"}</p>
                        <p className="text-[10px] text-gray-400 font-black mt-1.5 uppercase tracking-widest">
                          SỐ LƯỢNG: {item.quantity || 0}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-pink-600 text-sm">
                          {formatPrice((item.price || 0) * (item.quantity || 0))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-pink-600 opacity-20 rounded-full translate-x-8 translate-y-8 blur-lg group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-gray-400 uppercase">
                    <span>Tổng giá trị hàng:</span>
                    <span className="text-white text-xs">{formatPrice(selectedOrder.subTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-gray-400 uppercase">
                    <span>Phí giao hàng (GHTK):</span>
                    <span className="text-white text-xs whitespace-nowrap">
                      {selectedOrder.shippingFee && selectedOrder.shippingFee > 0
                        ? formatPrice(selectedOrder.shippingFee)
                        : "Miễn phí 0 ₫"}
                    </span>
                  </div>
                  <div className="pt-6 mt-2 border-t border-white/10 flex justify-between items-center transition-transform duration-300 group-hover:translate-x-1">
                    <div>
                      <span className="text-xs font-black text-pink-400 uppercase tracking-[0.3em] block mb-1">Tổng cộng</span>
                      <span className="text-gray-500 text-[9px] font-bold italic tracking-wider">Đã bao gồm VAT & Phí dịch vụ</span>
                    </div>
                    <span className="text-3xl font-black text-white tracking-tighter">
                      {formatPrice(selectedOrder.totalPrice || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Sub-component: CancelOrderDialog (Optimized) ---
interface CancelOrderDialogProps {
  order: OrderRes | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CancelOrderDialog = memo(({ order, onClose, onSuccess }: CancelOrderDialogProps) => {
  const { toast } = useToast();
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleCancelSubmit = async () => {
    if (!order) return;
    
    const finalReason = cancelReason === "Lý do khác" ? customReason : cancelReason;
    if (cancelReason === "Lý do khác" && !customReason.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập lý do hủy đơn.",
      });
      return;
    }

    try {
      setCancelling(true);
      await cancelOrderApi(order.id, finalReason);
      toast({
        title: "Thành công",
        description: `Đơn hàng #${order.id} đã được hủy.`,
      });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể hủy đơn hàng vào lúc này.",
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <AlertDialog
      open={!!order}
      onOpenChange={(open) => !open && !cancelling && onClose()}
    >
      <AlertDialogContent className="max-w-md rounded-3xl p-6 md:p-8 bg-white border-none shadow-2xl">
        <AlertDialogHeader>
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <AlertDialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Hủy đơn hàng này?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-500 font-bold text-sm leading-relaxed pt-2">
            Bạn đang yêu cầu hủy đơn hàng <span className="text-red-500 font-black">#{order?.transactionID || order?.id}</span>. 
            Vui lòng cho chúng tôi biết lý do của bạn nhé.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6">
          <RadioGroup 
            value={cancelReason} 
            onValueChange={setCancelReason}
            className="space-y-3"
          >
            {CANCEL_REASONS.map((reason) => (
              <div 
                key={reason} 
                className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                onClick={() => setCancelReason(reason)}
              >
                <RadioGroupItem value={reason} id={reason} className="border-gray-300 text-pink-600 focus:ring-pink-600" />
                <Label htmlFor={reason} className="text-sm font-bold text-gray-700 cursor-pointer flex-1 py-1">
                  {reason}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {cancelReason === "Lý do khác" && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Input 
                placeholder="Nhập lý do chi tiết của bạn..."
                className="rounded-xl border-gray-200 font-bold h-12 focus:ring-pink-600"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-3 sm:gap-2">
          <AlertDialogCancel 
            disabled={cancelling}
            className="rounded-full h-12 font-bold bg-gray-50 border-none hover:bg-gray-100 text-gray-500"
          >
            Quay lại
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              disabled={cancelling}
              onClick={(e) => {
                e.preventDefault();
                handleCancelSubmit();
              }}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full h-12 font-black shadow-lg shadow-red-200/50 active:scale-95 transition-all w-full sm:w-auto min-w-[120px]"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý
                </>
              ) : (
                "Xác nhận hủy"
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

export default Orders;
