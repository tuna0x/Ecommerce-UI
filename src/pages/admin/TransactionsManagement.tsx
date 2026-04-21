import React, { useState, useEffect, useCallback } from "react";
import { Search, Eye, Loader2, RefreshCw, Calendar, X, Filter, RotateCcw, BarChart3, ReceiptText, CreditCard, Wallet, Banknote, ListRestart, Info } from "lucide-react";
import {
  Card,
  CardContent,
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
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { getAllTransactionsAdminApi, type TransactionRes } from "../../service/transactionService";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { isValidDate, clampYear } from "../../lib/date";

// --------- Constants ---------
const STATUS_OPTIONS = [
  { value: "PENDING",   label: "Đang chờ", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "SUCCESS",   label: "Thành công", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "FAIL",      label: "Thất bại", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "REFUNDED",  label: "Đã hoàn tiền", color: "bg-blue-100 text-blue-800 border-blue-200" },
];

const METHOD_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  COD: { label: "COD", icon: Banknote, color: "text-orange-600 bg-orange-50" },
  VNPAY: { label: "VNPAY", icon: Wallet, color: "text-blue-600 bg-blue-50" },
  MOMO: { label: "MoMo", icon: CreditCard, color: "text-pink-600 bg-pink-50" },
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
const TransactionsManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionRes[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Detail dialog
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRes | null>(null);

  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");

  // ---- Fetch ----
  const fetchTransactions = useCallback(async (page: number, status: string, start?: string, end?: string, externalId?: string) => {
    try {
      setLoading(true);
      if ((start && !isValidDate(start)) || (end && !isValidDate(end))) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const startISO = start ? new Date(start).toISOString() : undefined;
      const endISO = end ? new Date(end).toISOString() : undefined;
      
      const res = await getAllTransactionsAdminApi(page, PAGE_SIZE, status, startISO, endISO, externalId);
      const data = res?.data?.data;
      
      if (data) {
        const result: TransactionRes[] = Array.isArray(data.result) ? data.result : [];
        setTransactions(result);
        setTotalPages(data.meta?.pages ?? 1);
        setTotalItems(data.meta?.total ?? result.length);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      toast.error("Không thể tải danh sách giao dịch");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, appliedStartDate, appliedEndDate]);

  useEffect(() => {
    fetchTransactions(currentPage, statusFilter, appliedStartDate, appliedEndDate, searchTerm);
  }, [fetchTransactions, currentPage, statusFilter, appliedStartDate, appliedEndDate]);

  const handleSearch = () => {
    // Validate date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }
    
    setCurrentPage(1);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    fetchTransactions(1, statusFilter, startDate, endDate, searchTerm);
  };

  const handleReset = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setStatusFilter("all");
    setCurrentPage(1);
    toast.success("Đã đặt lại bộ lọc");
  };

  // ---- Helper for raw data rendering ----
  const renderRawData = (data: string) => {
    try {
      // Try to parse as JSON if it looks like one
      if (data.startsWith('{') || data.startsWith('[')) {
        const parsed = JSON.parse(data);
        return <pre className="p-4 bg-muted/30 rounded-lg overflow-x-auto w-full max-w-full max-h-[400px] text-[12px] font-mono whitespace-pre-wrap break-all">{JSON.stringify(parsed, null, 2)}</pre>;
      }
      // Or just map format if it looks like a Map.toString() {key=value, key2=value2}
      if (data.startsWith('{') && data.includes('=')) {
          const cleaned = data.slice(1, -1);
          const pairs = cleaned.split(', ').map(p => {
              const [k, v] = p.split('=');
              return { k, v };
          });
          return (
              <div className="grid grid-cols-1 gap-1 p-2 bg-muted/20 rounded border w-full max-w-full">
                  {pairs.map((p, i) => (
                      <div key={i} className="flex border-b border-muted last:border-0 py-1.5 px-2 hover:bg-muted/30 transition-colors w-full min-w-0">
                          <span className="font-semibold w-1/3 text-muted-foreground truncate">{p.k}</span>
                          <span className="flex-1 font-mono text-primary break-all">{p.v}</span>
                      </div>
                  ))}
              </div>
          );
      }
      return <div className="p-4 bg-muted/30 rounded-lg font-mono text-sm break-all w-full">{data}</div>;
    } catch (e) {
      return <div className="p-4 bg-muted/30 rounded-lg font-mono text-sm break-all w-full">{data}</div>;
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Quản lý giao dịch</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Theo dõi luồng tiền và lịch sử thanh toán toàn hệ thống
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTransactions(currentPage, statusFilter, appliedStartDate, appliedEndDate, searchTerm)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng số bản ghi</p>
                <h3 className="text-2xl font-bold mt-1">{totalItems}</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Placeholder for real stats if we had a proper aggregate API */}
        <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Thành công (Trang này)</p>
                <h3 className="text-2xl font-bold mt-1 text-green-600">
                    {transactions.filter(t => t.status === 'SUCCESS').length}
                </h3>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <AnimatePresence>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Loader2 className="h-5 w-5 text-green-600" />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs */}
      <div className="flex border-b overflow-x-auto no-scrollbar gap-1 p-1 bg-muted/20 rounded-lg">
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
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-muted/20">
        <CardContent className="pt-6 pb-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-end">
            {/* Search Part */}
            <div className="xl:col-span-4 space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Mã giao dịch Gateway..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-10 bg-background"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Date Range Part */}
            <div className="xl:col-span-5 space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Khoảng thời gian</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative w-full">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(clampYear(e.target.value))}
                    className="pl-10 bg-background text-sm w-full"
                  />
                </div>
                <div className="text-muted-foreground text-[10px] sm:text-xs font-bold px-1 text-center">ĐẾN</div>
                <div className="relative w-full">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(clampYear(e.target.value))}
                    className="pl-10 bg-background text-sm w-full"
                  />
                </div>
              </div>
            </div>

            {/* Buttons Part */}
            <div className="xl:col-span-3">
              <div className="flex gap-2 shrink-0">
                <Button onClick={handleSearch} className="h-10 flex-1 gap-2 font-semibold shadow-sm">
                  <Filter className="h-4 w-4" /> Lọc kết quả
                </Button>
                <Button variant="outline" onClick={handleReset} className="h-10 px-4 gap-2 bg-background hover:bg-muted shadow-sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-none shadow-lg w-full min-w-0 overflow-hidden relative">
        <div className="w-full overflow-x-auto no-scrollbar pb-2">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground font-semibold">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Đơn hàng</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Phương thức</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Mã GD Gateway</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                        <span className="text-muted-foreground font-medium">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground italic">
                    Không tìm thấy giao dịch nào phù hợp.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const status = getStatusConfig(t.status);
                  const method = METHOD_CONFIG[t.paymentMethod] || { label: t.paymentMethod, icon: CreditCard, color: "bg-gray-50 text-gray-600" };
                  
                  return (
                    <motion.tr 
                        key={t.id} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-6 py-4 font-bold text-foreground/80">#{t.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-semibold text-primary">#{t.order?.id || 'N/A'}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{t.createdBy || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap", method.color)}>
                            <method.icon className="h-3.5 w-3.5" />
                            {method.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", status.color)}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {t.externalId || t.external_id || "—"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedTransaction(t)}
                          className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-muted/10 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Trang {currentPage} / {totalPages} (Tổng {totalItems} bản ghi)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="h-8 px-3"
              >
                Trước
              </Button>
              <div className="flex gap-1 items-center px-2 font-medium text-xs">
                  {currentPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
                className="h-8 px-3"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="w-[95vw] max-w-2xl sm:max-w-[700px] overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ReceiptText className="h-5 w-5 text-primary" />
              Chi tiết giao dịch #{selectedTransaction?.id}
            </DialogTitle>
            <DialogDescription>
              Xem chi tiết phản hồi từ cổng thanh toán và thông tin đơn hàng liên quan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-4 -mr-1 sm:-mr-4 no-scrollbar">
            <div className="space-y-6 py-2 w-full min-w-0">
                {/* Status Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Trạng thái</p>
                        <Badge className={cn("mt-1", getStatusConfig(selectedTransaction?.status || '').color)}>
                            {getStatusConfig(selectedTransaction?.status || '').label}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Phương thức</p>
                        <p className="mt-1 font-bold text-sm">{selectedTransaction?.paymentMethod}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Số tiền</p>
                        <p className="mt-1 font-bold text-primary">{formatCurrency(selectedTransaction?.amount)}</p>
                    </div>
                </div>
                
                {selectedTransaction?.status === 'REFUNDED' && (
                  <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-blue-900">Ghi chú về hoàn tiền</p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Yêu cầu hoàn tiền đã được tiếp nhận thành công. Thực tế tiền sẽ được ngân hàng hoàn lại vào tài khoản khách hàng trong vòng **7-14 ngày làm việc** (hoặc lên đến 30 ngày với thẻ quốc tế).
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
                    <Card className="shadow-none bg-background border-muted w-full min-w-0 overflow-hidden">
                        <CardContent className="p-4 space-y-3">
                            <h4 className="flex items-center gap-2 text-sm font-bold border-b pb-2">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Thông tin hệ thống
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm w-full min-w-0 gap-2">
                                    <span className="text-muted-foreground shrink-0">Người thực hiện:</span>
                                    <span className="font-medium break-all text-right">{selectedTransaction?.createdBy || 'System'}</span>
                                </div>
                                <div className="flex justify-between text-sm w-full min-w-0 gap-2">
                                    <span className="text-muted-foreground">Thời gian tạo:</span>
                                    <span className="font-medium">{formatDate(selectedTransaction?.createdAt)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-none bg-background border-muted w-full min-w-0 overflow-hidden">
                        <CardContent className="p-4 space-y-3">
                            <h4 className="flex items-center gap-2 text-sm font-bold border-b pb-2">
                                <CreditCard className="h-4 w-4 text-primary" />
                                Thông tin cổng thanh toán
                            </h4>
                            <div className="space-y-2 w-full min-w-0">
                                <div className="flex justify-between text-sm w-full min-w-0 gap-2">
                                    <span className="text-muted-foreground shrink-0">Mã GD Gateway:</span>
                                    <span className="font-mono text-xs font-bold break-all ml-2 text-right">
                                        {selectedTransaction?.externalId || selectedTransaction?.external_id || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Raw Data Section */}
                <div className="space-y-2 w-full min-w-0 overflow-hidden">
                    <h4 className="flex items-center gap-2 text-sm font-bold px-1">
                        <ListRestart className="h-4 w-4 text-primary" />
                        Dữ liệu phản hồi gốc (Raw Data)
                    </h4>
                    {selectedTransaction?.rawData ? renderRawData(selectedTransaction.rawData) : (
                        <div className="p-8 text-center text-muted-foreground italic border rounded-lg bg-muted/10">
                            Không có dữ liệu phản hồi kèm theo.
                        </div>
                    )}
                </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setSelectedTransaction(null)}>Đóng</Button>
            <Button className="gap-2" onClick={() => window.open(`/admin/orders`, '_blank')}>
                <Eye className="h-4 w-4" /> Đi tới đơn hàng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsManagement;
