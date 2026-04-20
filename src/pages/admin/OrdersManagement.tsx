import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Eye, ChevronDown, Loader2, RefreshCw, Package, Calendar, CheckSquare, Square, History, Printer, X, SearchX, RotateCcw, Filter, Zap, ExternalLink, Edit2, Save, Undo2 } from "lucide-react";
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
  DialogDescription,
} from "../../components/ui/dialog";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Checkbox } from "../../components/ui/Checkbox";
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
import { getAllOrdersAdminApi, bulkUpdateOrderStatusApi, createGhnOrderApi, bulkCreateGhnOrdersApi, updateOrderAddressApi, type OrderRes } from "../../service/orderService";
import { SearchableSelect } from "../../components/SearchableSelect";
import { addressDataService, type LocationItem } from "../../service/addressDataService";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { DATE_MIN, getTodayStr, isValidDate, clampYear } from "../../lib/date";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

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
  const [isBulkGhnDialogOpen, setIsBulkGhnDialogOpen] = useState(false);
  const [bulkGhnSelectedIds, setBulkGhnSelectedIds] = useState<Set<number>>(new Set());
  const [isCreatingBulkGhn, setIsCreatingBulkGhn] = useState(false);
  
  // Address editing
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressData, setEditAddressData] = useState<Partial<OrderRes>>({});
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  // Location Data for editing
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);

  // Filter orders for aggregate GHN dialog
  const confirmedOrdersForGhn = useMemo(() => {
    return orders.filter(o => o.status === 'CONFIRMED' && !o.shippingCode);
  }, [orders]);

  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");

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
  }, [statusFilter, appliedStartDate, appliedEndDate]);

  useEffect(() => {
    fetchOrders(currentPage, statusFilter, appliedStartDate, appliedEndDate);
  }, [fetchOrders, currentPage, statusFilter, appliedStartDate, appliedEndDate]);

  // ---- WebSocket for Real-time Updates ----
  useEffect(() => {
    // The base URL from axios usually ends with /api/v1, but websocket is at /websocket
    const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
    const wsHost = baseURL.replace("/api/v1", "");
    const socket = new SockJS(`${wsHost}/websocket`);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (_str) => {
        // Suppress redundant logs
      },
      onConnect: () => {
        // console.log("Connected to WebSocket");
        client.subscribe("/topic/order-updates", (message) => {
          if (message.body) {
            const updatedOrder: OrderRes = JSON.parse(message.body);
            // Update the local list if the order is present
            setOrders((prev) => 
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
            
            // Also update selected order if it's open in dialog
            setSelectedOrder((prev) => (prev?.id === updatedOrder.id ? updatedOrder : prev));
          }
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);

  // Debounced validation checks
  useEffect(() => {
    const timer = setTimeout(() => {
      const today = getTodayStr();
      if (startDate && startDate < DATE_MIN) {
        toast.error("Ngày bắt đầu không được nhỏ hơn năm 2000");
      } else if (endDate && endDate < DATE_MIN) {
        toast.error("Ngày kết thúc không được nhỏ hơn năm 2000");
      } else if (startDate && startDate > today) {
        toast.error("Ngày bắt đầu không được lớn hơn hiện tại");
      } else if (endDate && endDate > today) {
        toast.error("Ngày kết thúc không được lớn hơn hiện tại");
      } else if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        toast.error("Ngày bắt đầu không thể lớn hơn ngày kết thúc");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [startDate, endDate]);

  useEffect(() => {
    const loadProvinces = async () => {
      const data = await addressDataService.getProvinces();
      setProvinces(data);
    };
    loadProvinces();
  }, []);

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

  const [isCreatingGhn, setIsCreatingGhn] = useState<number | null>(null);
  const handleCreateGhnOrder = async (orderId: number) => {
    try {
      setIsCreatingGhn(orderId);
      const res = await createGhnOrderApi(orderId);
      // Access res.data.data because the backend wraps responses in a RestResponse object
      const updatedOrder: OrderRes = res.data?.data || res.data;
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, shippingCode: updatedOrder.shippingCode, status: updatedOrder.status } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, shippingCode: updatedOrder.shippingCode, status: updatedOrder.status } : null);
      }
      
      toast.success(`Đã tạo vận đơn GHN thành công: ${updatedOrder.shippingCode}`);
    } catch (err: any) {
      console.error("GHN Creation failed:", err);
      toast.error(err.response?.data?.message || "Không thể tạo vận đơn GHN. Vui lòng kiểm tra lại địa chỉ.");
    } finally {
      setIsCreatingGhn(null);
    }
  };

  const [isSimulating, setIsSimulating] = useState(false);
  const handleSimulateDelivery = async (shippingCode: string) => {
    try {
      setIsSimulating(true);
      // Directly hit the webhook endpoint to simulate GHN signal
      const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
      const apiRoot = baseURL.replace("/api/v1", "");
      
      await fetch(`${apiRoot}/api/v1/public/webhooks/ghn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          OrderCode: shippingCode,
          Status: 'delivered'
        })
      });
      
      toast.success("Đã gửi tín hiệu giả lập 'Giao hàng thành công'!", {
        description: "Hệ thống sẽ tự động cập nhật trạng thái qua WebSocket bộ sau vài giây."
      });
    } catch (err) {
      console.error("Simulation failed:", err);
      toast.error("Không thể gửi tín hiệu giả lập.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAdminProvinceChange = async (provinceName: string) => {
    setEditAddressData(prev => ({ ...prev, province: provinceName, district: "", ward: "" }));
    setDistricts([]);
    setWards([]);
    
    const province = provinces.find(p => p.name === provinceName);
    if (province) {
      const data = await addressDataService.getDistricts(province.code);
      setDistricts(data);
    }
  };

  const handleAdminDistrictChange = async (districtName: string) => {
    setEditAddressData(prev => ({ ...prev, district: districtName, ward: "" }));
    setWards([]);

    const district = districts.find(d => d.name === districtName);
    if (district) {
      const data = await addressDataService.getWards(district.code);
      setWards(data);
    }
  };

  const handleStartEditAddress = async () => {
    if (!selectedOrder) return;
    
    // Initial data
    setEditAddressData({
      receiverName: selectedOrder.receiverName,
      phone: selectedOrder.phone,
      shippingAddress: selectedOrder.shippingAddress,
      ward: selectedOrder.ward,
      district: selectedOrder.district,
      province: selectedOrder.province
    });

    setIsEditingAddress(true);

    // Pre-load districts/wards if we have current address data
    if (selectedOrder.province) {
      const p = provinces.find(x => x.name === selectedOrder.province);
      if (p) {
        const dData = await addressDataService.getDistricts(p.code);
        setDistricts(dData);
        
        if (selectedOrder.district) {
          const d = dData.find(x => x.name === selectedOrder.district);
          if (d) {
            const wData = await addressDataService.getWards(d.code);
            setWards(wData);
          }
        }
      }
    }
  };

  const handleSaveAddress = async () => {
    if (!selectedOrder) return;
    try {
      setIsSavingAddress(true);
      await updateOrderAddressApi(selectedOrder.id, editAddressData);
      
      const updatedOrder = { ...selectedOrder, ...editAddressData };
      
      // Update local state
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
      setSelectedOrder(updatedOrder);
      setIsEditingAddress(false);
      toast.success("Đã cập nhật địa chỉ thành công");
    } catch (err: any) {
      console.error("Address update failed:", err);
      toast.error(err.response?.data?.message || "Không thể cập nhật địa chỉ");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleBulkCreateGhnOrders = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    // Only process confirmed orders without shipping code
    const validIds = orders
      .filter(o => ids.includes(o.id) && o.status === 'CONFIRMED' && !o.shippingCode)
      .map(o => o.id);

    if (validIds.length === 0) {
      toast.error("Vui lòng chọn các đơn hàng 'Đã xác nhận' và chưa có mã vận đơn.");
      return;
    }

    try {
      setIsCreatingBulkGhn(true);
      const res = await bulkCreateGhnOrdersApi(validIds);
      // Access res.data.data because the backend wraps responses in a RestResponse object
      const updatedOrders: OrderRes[] = res.data?.data || [];
      
      const updatedMap = new Map((Array.isArray(updatedOrders) ? updatedOrders : []).map(o => [o.id, o]));
      
      setOrders(prev => prev.map(o => {
        const updated = updatedMap.get(o.id);
        if (updated) {
          return {
            ...o,
            shippingCode: updated.shippingCode,
            status: updated.status
          };
        }
        return o;
      }));

      const successCount = updatedOrders.filter(o => o.shippingCode).length;
      toast.success(`Đã tạo thành công ${successCount}/${validIds.length} vận đơn GHN.`);
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk GHN creation failed:", err);
      toast.error("Quá trình tạo vận đơn hàng loạt gặp lỗi.");
    } finally {
      setIsCreatingBulkGhn(false);
    }
  };

  const handlePrintGhnLabel = (shippingCode: string) => {
    if (!shippingCode) return;
    
    // Check if it's a mock shipping code
    if (shippingCode.startsWith("MOCK_GHN_")) {
      toast.info("Chế độ Test: Mã vận đơn là giả nên không thể in nhãn thật từ GHN.", {
        description: `Mã của bạn: ${shippingCode}`,
        duration: 5000
      });
      return;
    }

    // Official GHN Print URL: https://5p.ghn.vn/order/print/ is the old one, 
    // real printing usually requires a token or follows their new online-gateway format.
    // However, 5p.ghn.vn is still used by many, but we'll use the current active one.
    window.open(`https://5p.ghn.vn/order/print/${shippingCode}`, '_blank');
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
          <title>Hóa đơn #${order.id}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, sans-serif; 
              padding: 50px; 
              color: #1a1a1a; 
              line-height: 1.5;
              background-color: white;
            }
            .container { max-width: 850px; margin: 0 auto; }
            
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              margin-bottom: 50px;
              padding-bottom: 30px;
              border-bottom: 2px solid #f3f4f6;
            }
            .brand { color: #e11d48; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
            .brand span { color: #1a1a1a; }
            .company-info { text-align: right; color: #4b5563; font-size: 13px; }
            
            .invoice-meta { margin-bottom: 40px; display: flex; justify-content: space-between; }
            .invoice-title { font-size: 32px; font-weight: 800; color: #111827; margin-bottom: 8px; }
            .meta-item { color: #6b7280; font-size: 14px; }
            .meta-item strong { color: #111827; }

            .addresses { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 60px; 
              margin-bottom: 50px;
              padding: 24px;
              background-color: #f9fafb;
              border-radius: 12px;
            }
            .address-box h3 { 
              font-size: 12px; 
              text-transform: uppercase; 
              color: #9ca3af; 
              letter-spacing: 1px; 
              margin-bottom: 12px;
              font-weight: 700;
            }
            .address-box p { font-size: 14px; margin-bottom: 4px; }
            .name { font-weight: 700; color: #111827; font-size: 16px !important; margin-bottom: 8px !important; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { 
              text-align: left; 
              background-color: #f3f4f6; 
              padding: 14px 16px; 
              font-size: 12px; 
              font-weight: 700; 
              text-transform: uppercase;
              color: #4b5563;
              border-radius: 0;
            }
            th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
            th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; text-align: right; }
            
            td { padding: 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
            td:last-child { text-align: right; font-weight: 600; }
            .product-name { font-weight: 600; color: #111827; }
            .product-qty { color: #6b7280; }

            .summary-container { display: flex; justify-content: flex-end; }
            .summary { width: 320px; }
            .summary-item { 
              display: flex; 
              justify-content: space-between; 
              padding: 8px 0; 
              font-size: 14px; 
              color: #4b5563;
            }
            .total { 
              margin-top: 16px;
              padding-top: 16px;
              border-top: 2px solid #111827;
              font-size: 20px;
              font-weight: 800;
              color: #111827;
            }
            .total .price { color: #e11d48; }

            .footer { 
              margin-top: 80px; 
              text-align: center; 
              padding-top: 40px; 
              border-top: 1px dashed #e5e7eb;
              color: #9ca3af;
              font-size: 13px;
            }
            .thank-you { color: #4b5563; font-weight: 600; font-size: 15px; margin-bottom: 8px; }

            @media print {
              body { padding: 30px; }
              .no-print { display: none; }
              @page { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="brand">BÔNG<span>COSMETIC</span></div>
              <div class="company-info">
                <p>180 Triều Khúc, Tân Triều, Thanh Trì, Hà Nội</p>
                <p>Hotline: 0949.098.987</p>
                <p>Website: bongcosmetic.id.vn</p>
              </div>
            </div>

            <div class="invoice-meta">
              <div>
                <h1 class="invoice-title">HÓA ĐƠN BÁN HÀNG</h1>
                <p class="meta-item">Mã đơn hàng: <strong>#${order.id}</strong></p>
                <p class="meta-item">Ngày lập: <strong>${formatDate(order.createdAt)}</strong></p>
              </div>
              <div style="text-align: right">
                <p class="meta-item" style="margin-top: 40px">Trạng thái: <strong>Đã thanh toán</strong></p>
              </div>
            </div>

            <div class="addresses">
              <div class="address-box">
                <h3>Người đặt hàng</h3>
                <p class="name">${order.user?.name || 'Khách vãng lai'}</p>
                <p>${order.user?.email || ''}</p>
                <p>${order.phone || ''}</p>
              </div>
              <div class="address-box">
                <h3>Địa chỉ giao hàng</h3>
                <p class="name">${order.receiverName}</p>
                <p>${order.phone}</p>
                <p>${order.shippingAddress}, ${order.ward}, ${order.district}, ${order.province}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 50%">Sản phẩm</th>
                  <th>Số lượng</th>
                  <th style="text-align: right">Đơn giá</th>
                  <th style="text-align: right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${order.items?.map(item => `
                  <tr>
                    <td>
                      <div class="product-name">${item.productName}</div>
                    </td>
                    <td class="product-qty">x${item.quantity}</td>
                    <td style="text-align: right">${formatCurrency(item.price)}</td>
                    <td style="text-align: right">${formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary-container">
              <div class="summary">
                <div class="summary-item">
                  <span>Tạm tính</span>
                  <span>${formatCurrency(order.subTotal)}</span>
                </div>
                <div class="summary-item">
                  <span>Phí vận chuyển</span>
                  <span>+${formatCurrency(order.shippingFee)}</span>
                </div>
                ${order.discountPrice ? `
                  <div class="summary-item" style="color: #e11d48">
                    <span>Giảm giá</span>
                    <span>-${formatCurrency(order.discountPrice)}</span>
                  </div>
                ` : ''}
                <div class="summary-item total">
                  <span>TỔNG CỘNG</span>
                  <span class="price">${formatCurrency(order.totalPrice)}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p class="thank-you">Cảm ơn quý khách đã tin tưởng mua sắm!</p>
              <p>Mọi thắc mắc vui lòng liên hệ hotline để được hỗ trợ.</p>
              <p style="margin-top: 10px; font-style: italic;">Đây là hóa đơn điện tử được tạo tự động.</p>
            </div>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                // window.close();
              }, 500);
            };
          </script>
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
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tổng: <span className="font-semibold text-foreground">{totalItems}</span> đơn hàng
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-primary hover:bg-primary/90 gap-2 shadow-lg"
            onClick={() => {
              setBulkGhnSelectedIds(new Set(confirmedOrdersForGhn.map(o => o.id)));
              setIsBulkGhnDialogOpen(true);
            }}
          >
            <Zap className="h-4 w-4 fill-white" />
            Tổng hợp đơn GHN 🚀
          </Button>

          <Button
            variant="default"
            size="sm"
            className={cn(
              "gap-2 shadow-sm transition-all duration-300",
              selectedIds.size > 0 
                ? "bg-orange-600 hover:bg-orange-700 ring-2 ring-orange-200" 
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            onClick={handleBulkCreateGhnOrders}
            disabled={isCreatingBulkGhn || selectedIds.size === 0}
          >
            {isCreatingBulkGhn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
            Chuyển GHN {selectedIds.size > 0 ? `(${selectedIds.size})` : "hàng loạt"}
          </Button>

          {selectedIds.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-primary/20 bg-primary/5">
                  Thao tác ({selectedIds.size}) <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {STATUS_OPTIONS.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    onClick={() => handleBulkUpdateStatus(s.value)}
                  >
                    Chuyển sang {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
            <div className="flex flex-col md:flex-row gap-4 items-center w-full">
              <div className="relative group flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Mã đơn, tên, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 w-full"
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
              <div className="relative w-full md:w-[180px]">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Ngày bắt đầu"
                  value={startDate}
                  min={DATE_MIN}
                  max={getTodayStr()}
                  onChange={(e) => setStartDate(clampYear(e.target.value))}
                  className="pl-10 w-full"
                />
              </div>
              <div className="relative w-full md:w-[180px]">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Ngày kết thúc"
                  value={endDate}
                  min={startDate || DATE_MIN}
                  max={getTodayStr()}
                  onChange={(e) => setEndDate(clampYear(e.target.value))}
                  className="pl-10 w-full"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto shrink-0">
                <Button 
                  onClick={() => {
                    const today = getTodayStr();
                    if (startDate && startDate < DATE_MIN) {
                      toast.error("Ngày bắt đầu không được nhỏ hơn năm 2000");
                      return;
                    }
                    if (endDate && endDate < DATE_MIN) {
                      toast.error("Ngày kết thúc không được nhỏ hơn năm 2000");
                      return;
                    }
                    if (startDate && startDate > today) {
                      toast.error("Ngày bắt đầu không được lớn hơn hiện tại");
                      return;
                    }
                    if (endDate && endDate > today) {
                      toast.error("Ngày kết thúc không được lớn hơn hiện tại");
                      return;
                    }
                    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
                      toast.error("Ngày bắt đầu không thể lớn hơn ngày kết thúc");
                      return;
                    }
                    setAppliedStartDate(startDate);
                    setAppliedEndDate(endDate);
                  }}
                  className="h-9 px-3 flex-1 md:flex-none"
                >
                  <Filter className="h-4 w-4 mr-2" /> Lọc
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setAppliedStartDate("");
                    setAppliedEndDate("");
                  }}
                  className="h-9 px-3 flex-1 md:flex-none"
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Reset
                </Button>
              </div>
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
                          <div className="flex items-center justify-end gap-1">

                            {order.shippingCode && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                onClick={() => handlePrintGhnLabel(order.shippingCode!)}
                                title="In nhãn GHN"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
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
      <Dialog 
        open={!!selectedOrder} 
        onOpenChange={() => {
          setSelectedOrder(null);
          setIsEditingAddress(false);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="shrink-0">Chi tiết đơn hàng</span>
                  <span className="font-mono text-primary animate-pulse-subtle">
                    #{selectedOrder?.id}
                  </span>
                </div>
                <p className="text-xs font-mono text-muted-foreground font-normal">
                  Mã giao dịch: {selectedOrder?.transactionID || "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedOrder?.shippingCode?.startsWith("MOCK_GHN_") && selectedOrder.status !== 'DELIVERED' && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="h-8 gap-1 text-xs bg-amber-600 hover:bg-amber-700 animate-pulse"
                    onClick={() => handleSimulateDelivery(selectedOrder.shippingCode!)}
                    disabled={isSimulating}
                  >
                    {isSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Giả lập Giao thành công 🛠️"}
                  </Button>
                )}
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
                {!selectedOrder?.shippingCode && selectedOrder?.status === 'CONFIRMED' && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="h-8 gap-1 text-xs bg-orange-600 hover:bg-orange-700"
                    onClick={() => handleCreateGhnOrder(selectedOrder!.id)}
                    disabled={isCreatingGhn === selectedOrder?.id}
                  >
                    {isCreatingGhn === selectedOrder?.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 fill-current" />}
                    Tạo đơn GHN
                  </Button>
                )}
                {selectedOrder?.shippingCode && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => handlePrintGhnLabel(selectedOrder!.shippingCode!)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    In nhãn GHN
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
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Người nhận</p>
                    {selectedOrder.status === 'PENDING' && !isEditingAddress && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-[10px] gap-1 hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={handleStartEditAddress}
                      >
                        <Edit2 className="h-3 w-3" />
                        Chỉnh sửa
                      </Button>
                    )}
                  </div>

                  {isEditingAddress ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Họ tên</label>
                        <Input 
                          value={editAddressData.receiverName || ""} 
                          onChange={(e) => setEditAddressData({...editAddressData, receiverName: e.target.value})}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Số điện thoại</label>
                        <Input 
                          value={editAddressData.phone || ""} 
                          onChange={(e) => setEditAddressData({...editAddressData, phone: e.target.value})}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Địa chỉ chi tiết</label>
                        <Input 
                          value={editAddressData.shippingAddress || ""} 
                          onChange={(e) => setEditAddressData({...editAddressData, shippingAddress: e.target.value})}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Tỉnh/TP</label>
                          <SearchableSelect 
                            options={provinces.map(p => ({ value: p.name, label: p.name }))}
                            value={editAddressData.province || ""} 
                            onValueChange={handleAdminProvinceChange}
                            placeholder="Chọn Tỉnh"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Quận/Huyện</label>
                          <SearchableSelect 
                            options={districts.map(d => ({ value: d.name, label: d.name }))}
                            value={editAddressData.district || ""} 
                            onValueChange={handleAdminDistrictChange}
                            placeholder="Chọn Quận"
                            disabled={!editAddressData.province}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Phường/Xã</label>
                          <SearchableSelect 
                            options={wards.map(w => ({ value: w.name, label: w.name }))}
                            value={editAddressData.ward || ""} 
                            onValueChange={(val) => setEditAddressData({...editAddressData, ward: val})}
                            placeholder="Chọn Xã"
                            disabled={!editAddressData.district}
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          className="flex-1 h-8 gap-1 text-xs" 
                          onClick={handleSaveAddress}
                          disabled={isSavingAddress}
                        >
                          {isSavingAddress ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          Lưu
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 h-8 gap-1 text-xs"
                          onClick={() => setIsEditingAddress(false)}
                        >
                          <Undo2 className="h-3 w-3" />
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="flex gap-2"><span className="text-muted-foreground shrink-0">Tên:</span> <span className="font-semibold break-words">{selectedOrder.receiverName ?? "—"}</span></p>
                      <p className="flex gap-2"><span className="text-muted-foreground shrink-0">SĐT:</span> <span className="break-words">{selectedOrder.phone ?? "—"}</span></p>
                      <p className="flex gap-2">
                        <span className="text-muted-foreground shrink-0">Địa chỉ:</span> 
                        <span className="font-medium break-words">
                          {[selectedOrder.shippingAddress, selectedOrder.ward, selectedOrder.district, selectedOrder.province]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </span>
                      </p>
                    </>
                  )}
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
      {/* Batch GHN Dialog */}
      <Dialog open={isBulkGhnDialogOpen} onOpenChange={setIsBulkGhnDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Tổng hợp đơn hàng chuyển GHN
            </DialogTitle>
            <DialogDescription>
              Hệ thống tìm thấy <b>{confirmedOrdersForGhn.length}</b> đơn hàng đã xác nhận và sẵn sàng chuyển sang giao hàng nhanh.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden my-4 py-2 border rounded-md">
            <ScrollArea className="h-[400px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b z-10">
                  <tr className="text-left">
                    <th className="p-3 w-10">
                      <Checkbox
                        checked={bulkGhnSelectedIds.size === confirmedOrdersForGhn.length && confirmedOrdersForGhn.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) setBulkGhnSelectedIds(new Set(confirmedOrdersForGhn.map(o => o.id)));
                          else setBulkGhnSelectedIds(new Set());
                        }}
                      />
                    </th>
                    <th className="p-3">Mã đơn</th>
                    <th className="p-3">Khách hàng</th>
                    <th className="p-3">Tổng tiền</th>
                    <th className="p-3">Ngày đặt</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmedOrdersForGhn.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Không có đơn hàng nào chờ chuyển GHN.
                      </td>
                    </tr>
                  ) : (
                    confirmedOrdersForGhn.map((order) => (
                      <tr 
                        key={order.id} 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          const next = new Set(bulkGhnSelectedIds);
                          if (next.has(order.id)) next.delete(order.id);
                          else next.add(order.id);
                          setBulkGhnSelectedIds(next);
                        }}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={bulkGhnSelectedIds.has(order.id)}
                            onCheckedChange={() => {
                              const next = new Set(bulkGhnSelectedIds);
                              if (next.has(order.id)) next.delete(order.id);
                              else next.add(order.id);
                              setBulkGhnSelectedIds(next);
                            }}
                          />
                        </td>
                        <td className="p-3 font-medium text-primary">#{order.id}</td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{order.receiverName}</span>
                            <span className="text-xs text-muted-foreground">{order.phone}</span>
                          </div>
                        </td>
                        <td className="p-3 font-semibold">{order.totalPrice.toLocaleString()}đ</td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(order.createdAt || "").toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Đã chọn: <span className="font-bold text-foreground">{bulkGhnSelectedIds.size}</span> đơn hàng
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsBulkGhnDialogOpen(false)}>
                Hủy
              </Button>
              <Button 
                disabled={bulkGhnSelectedIds.size === 0 || isCreatingBulkGhn}
                className="bg-orange-600 hover:bg-orange-700"
                onClick={async () => {
                  try {
                    setIsCreatingBulkGhn(true);
                    const res = await bulkCreateGhnOrdersApi(Array.from(bulkGhnSelectedIds));
                    // Access res.data.data because the backend wraps responses in a RestResponse object
                    const updatedOrders: OrderRes[] = res.data.data || [];
                    
                    const updatedMap = new Map((Array.isArray(updatedOrders) ? updatedOrders : []).map(o => [o.id, o]));
                    setOrders(prev => prev.map(o => {
                      const updated = updatedMap.get(o.id);
                      if (updated) {
                        return { 
                          ...o, 
                          shippingCode: updated.shippingCode,
                          status: updated.status 
                        };
                      }
                      return o;
                    }));

                    const successCount = updatedOrders.filter(o => o.shippingCode).length;
                    toast.success(`Đã tạo thành công ${successCount}/${bulkGhnSelectedIds.size} vận đơn GHN.`);
                    setIsBulkGhnDialogOpen(false);
                    setBulkGhnSelectedIds(new Set());
                  } catch (err) {
                    toast.error("Quá trình tạo vận đơn gặp lỗi.");
                  } finally {
                    setIsCreatingBulkGhn(false);
                  }
                }}
              >
                {isCreatingBulkGhn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                Xác nhận tạo vận đơn
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;
