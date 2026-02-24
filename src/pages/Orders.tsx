import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileNavBar from "../components/MobileNavBar";
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
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MapPin,
  Phone,
  CreditCard,
} from "lucide-react";

// Mock orders for user
const userOrders = [
  {
    id: "ORD-001",
    items: [
      {
        productId: 1,
        productName: "Serum Vitamin C 15% Làm Sáng Da",
        quantity: 2,
        price: 459000,
        image:
          "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100",
      },
      {
        productId: 2,
        productName: "Kem Chống Nắng SPF50+ PA++++",
        quantity: 1,
        price: 425000,
        image:
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100",
      },
    ],
    total: 1343000,
    status: "pending",
    paymentMethod: "cod",
    shippingAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    phone: "0901234567",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "ORD-002",
    items: [
      {
        productId: 3,
        productName: "Son Kem Lì Màu Đỏ Cherry",
        quantity: 1,
        price: 520000,
        image:
          "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=100",
      },
    ],
    total: 520000,
    status: "shipping",
    paymentMethod: "momo",
    shippingAddress: "456 Lê Lợi, Quận 3, TP.HCM",
    phone: "0901234567",
    createdAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "ORD-003",
    items: [
      {
        productId: 7,
        productName: "Kem Dưỡng Ẩm Cấp Nước 72H",
        quantity: 1,
        price: 520000,
        image:
          "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=100",
      },
      {
        productId: 11,
        productName: "Tinh Chất Retinol 0.5% Trẻ Hóa Da",
        quantity: 2,
        price: 320000,
        image:
          "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=100",
      },
    ],
    total: 1160000,
    status: "delivered",
    paymentMethod: "bank",
    shippingAddress: "789 Hai Bà Trưng, Quận 1, TP.HCM",
    phone: "0901234567",
    createdAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "ORD-004",
    items: [
      {
        productId: 8,
        productName: "Phấn Nền Cushion Che Phủ Hoàn Hảo",
        quantity: 1,
        price: 650000,
        image:
          "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=100",
      },
    ],
    total: 650000,
    status: "cancelled",
    paymentMethod: "cod",
    shippingAddress: "321 Võ Văn Tần, Quận 3, TP.HCM",
    phone: "0901234567",
    createdAt: "2024-01-10T16:45:00Z",
  },
];

const statusConfig = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
  },
  shipping: {
    label: "Đang giao",
    color: "bg-purple-100 text-purple-800",
    icon: Truck,
  },
  delivered: {
    label: "Đã giao",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

const paymentMethodLabels = {
  cod: "Thanh toán khi nhận hàng",
  bank: "Chuyển khoản ngân hàng",
  momo: "Ví MoMo",
};

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = React.useState<
    (typeof userOrders)[0] | null
  >(null);

  React.useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filterOrders = (status?: string) => {
    if (!status || status === "all") return userOrders;
    return userOrders.filter((order) => order.status === status);
  };

  const OrderCard = ({ order }: { order: (typeof userOrders)[0] }) => {
    const StatusIcon =
      statusConfig[order.status as keyof typeof statusConfig].icon;

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold">{order.id}</span>
                <Badge
                  className={
                    statusConfig[order.status as keyof typeof statusConfig]
                      .color
                  }
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {
                    statusConfig[order.status as keyof typeof statusConfig]
                      .label
                  }
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(order.createdAt)}
              </p>

              <div className="mt-3 space-y-2">
                {order.items.slice(0, 2).map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        x{item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <p className="text-sm text-muted-foreground">
                    +{order.items.length - 2} sản phẩm khác
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <p className="text-lg font-semibold text-primary">
                {formatPrice(order.total)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(order)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Chi tiết
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Đơn hàng của tôi</h1>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="all">Tất cả ({userOrders.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Chờ xác nhận ({filterOrders("pending").length})
            </TabsTrigger>
            <TabsTrigger value="shipping">
              Đang giao ({filterOrders("shipping").length})
            </TabsTrigger>
            <TabsTrigger value="delivered">
              Đã giao ({filterOrders("delivered").length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Đã hủy ({filterOrders("cancelled").length})
            </TabsTrigger>
          </TabsList>

          {["all", "pending", "shipping", "delivered", "cancelled"].map(
            (status) => (
              <TabsContent key={status} value={status}>
                {filterOrders(status === "all" ? undefined : status).length ===
                0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Không có đơn hàng nào
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filterOrders(status === "all" ? undefined : status).map(
                    (order) => <OrderCard key={order.id} order={order} />,
                  )
                )}
              </TabsContent>
            ),
          )}
        </Tabs>
      </main>

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Chi tiết đơn hàng {selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    statusConfig[
                      selectedOrder.status as keyof typeof statusConfig
                    ].color
                  }
                >
                  {
                    statusConfig[
                      selectedOrder.status as keyof typeof statusConfig
                    ].label
                  }
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDate(selectedOrder.createdAt)}
                </span>
              </div>

              {/* Shipping Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Thông tin giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {selectedOrder.phone}
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    {selectedOrder.shippingAddress}
                  </div>
                </CardContent>
              </Card>

              {/* Products */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Sản phẩm ({selectedOrder.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 py-2 border-b last:border-0"
                    >
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          Số lượng: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payment */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Phương thức:
                      </span>
                      <span>
                        {
                          paymentMethodLabels[
                            selectedOrder.paymentMethod as keyof typeof paymentMethodLabels
                          ]
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Phí vận chuyển:
                      </span>
                      <span>Miễn phí</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Tổng cộng:</span>
                      <span className="text-primary">
                        {formatPrice(selectedOrder.total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <MobileNavBar />
    </div>
  );
};

export default Orders;
