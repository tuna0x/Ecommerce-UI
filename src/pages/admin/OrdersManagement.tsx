import React, { useState } from "react";
import { Search, Eye, ChevronDown } from "lucide-react";
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
import { mockOrders } from "../../data/mockOrders";
import type { Order } from "../../data/mockOrders";
import { toast } from "sonner";

const statusOptions = [
  {
    value: "pending",
    label: "Chờ xác nhận",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "confirmed",
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "shipping",
    label: "Đang giao",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "delivered",
    label: "Đã giao",
    color: "bg-green-100 text-green-800",
  },
  { value: "cancelled", label: "Đã hủy", color: "bg-red-100 text-red-800" },
];

const paymentLabels: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng",
  bank: "Chuyển khoản ngân hàng",
  momo: "Ví MoMo",
};

const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find((s) => s.value === status);
    if (!option) return null;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}
      >
        {option.label}
      </span>
    );
  };

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order,
      ),
    );
    toast.success(`Đã cập nhật trạng thái đơn hàng ${orderId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý đơn hàng</h1>
        <p className="text-muted-foreground">
          Xem và cập nhật trạng thái đơn hàng
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã đơn, tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Mã đơn
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Khách hàng
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Ngày đặt
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Tổng tiền
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Trạng thái
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-3 px-2 text-sm font-medium">
                      {order.id}
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-sm font-medium">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customerEmail}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 px-2 text-sm font-medium">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3 px-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1">
                            {getStatusBadge(order.status)}
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {statusOptions.map((status) => (
                            <DropdownMenuItem
                              key={status.value}
                              onClick={() =>
                                updateOrderStatus(
                                  order.id,
                                  status.value as Order["status"],
                                )
                              }
                            >
                              {status.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2">Thông tin khách hàng</h3>
                <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Tên:</span>{" "}
                    {selectedOrder.customerName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {selectedOrder.customerEmail}
                  </p>
                  <p>
                    <span className="text-muted-foreground">SĐT:</span>{" "}
                    {selectedOrder.customerPhone}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Địa chỉ:</span>{" "}
                    {selectedOrder.address}
                  </p>
                </div>
              </div>

              {/* Order Info */}
              <div>
                <h3 className="font-semibold mb-2">Thông tin đơn hàng</h3>
                <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Ngày đặt:</span>{" "}
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Thanh toán:</span>{" "}
                    {paymentLabels[selectedOrder.paymentMethod]}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Trạng thái:</span>{" "}
                    {getStatusBadge(selectedOrder.status)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Sản phẩm</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          SL: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-semibold">Tổng cộng</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;
