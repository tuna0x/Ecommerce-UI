import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  DollarSign,
  Warehouse,
  Loader2,
  RefreshCcw
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../components/ui/select";
import {
  Calendar,
  FileSpreadsheet,
  Search,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { dashboardService, type StatisticsData } from "../../service/dashboardService";
import { DATE_MIN, getTodayStr, clampYear } from "../../lib/date";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#6366f1'];

const Statistics: React.FC = () => {
  const [data, setData] = React.useState<StatisticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [quickFilter, setQuickFilter] = React.useState<string>("last_30_days");

  const fetchData = async (s?: string, e?: string) => {
    try {
      setLoading(true);
      // Use parameters if provided, otherwise use current state
      const currentStart = s !== undefined ? s : startDate;
      const currentEnd = e !== undefined ? e : endDate;

      // Adjust dates to cover full day (local time to ISO)
      const startISO = currentStart ? new Date(`${currentStart}T00:00:00`).toISOString() : undefined;
      const endISO = currentEnd ? new Date(`${currentEnd}T23:59:59`).toISOString() : undefined;

      const stats = await dashboardService.getStatistics(startISO, endISO);
      setData(stats);
      setError(null);
    } catch (err) {
      console.error("Fetch statistics failed:", err);
      setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const today = getTodayStr();
      if (startDate && startDate < DATE_MIN) toast.error("Ngày bắt đầu không được nhỏ hơn năm 2000");
      else if (endDate && endDate < DATE_MIN) toast.error("Ngày kết thúc không được nhỏ hơn năm 2000");
      else if (startDate && startDate > today) toast.error("Ngày bắt đầu không được lớn hơn hiện tại");
      else if (endDate && endDate > today) toast.error("Ngày kết thúc không được lớn hơn hiện tại");
      else if (startDate && endDate && new Date(startDate) > new Date(endDate)) toast.error("Ngày bắt đầu không thể lớn hơn ngày kết thúc");
    }, 500);
    return () => clearTimeout(timer);
  }, [startDate, endDate]);

  const handleQuickFilter = (value: string) => {
    setQuickFilter(value);
    const now = new Date();
    let start = new Date();

    switch (value) {
      case "last_7_days":
        start.setDate(now.getDate() - 7);
        break;
      case "last_30_days":
        start.setDate(now.getDate() - 30);
        break;
      case "last_6_months":
        start.setMonth(now.getMonth() - 6);
        break;
      case "this_month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "this_year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start.setDate(now.getDate() - 30);
        break;
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = now.toISOString().split('T')[0];

    setStartDate(startStr);
    setEndDate(endStr);
    fetchData(startStr, endStr);
  };

  const handleSearch = () => {
    const today = getTodayStr();
    if (startDate && startDate < DATE_MIN) { toast.error("Ngày bắt đầu không được nhỏ hơn năm 2000"); return; }
    if (endDate && endDate < DATE_MIN) { toast.error("Ngày kết thúc không được nhỏ hơn năm 2000"); return; }
    if (startDate && startDate > today) { toast.error("Ngày bắt đầu không được lớn hơn hiện tại"); return; }
    if (endDate && endDate > today) { toast.error("Ngày kết thúc không được lớn hơn hiện tại"); return; }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) { toast.error("Ngày bắt đầu không thể lớn hơn ngày kết thúc"); return; }
    fetchData();
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setQuickFilter("last_30_days");
    fetchData("", "");
  };

  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const startISO = startDate ? new Date(`${startDate}T00:00:00`).toISOString() : undefined;
      const endISO = endDate ? new Date(`${endDate}T23:59:59`).toISOString() : undefined;

      const blob = await dashboardService.exportExcel(startISO, endISO);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `thong-ke-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Đã xuất file excel thành công");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Xuất file excel thất bại");
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value) + "đ";
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Đang thu thập dữ liệu thống kê...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <div className="bg-destructive/10 p-4 rounded-full">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Đã có lỗi xảy ra</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <RefreshCcw className="h-4 w-4" /> Thử lại
        </button>
      </div>
    );
  }

  if (!data) return null;

  const stockStatusData = [
    { name: "Đủ hàng", value: data.totalProducts - data.inventorySummary.lowStockCount - data.inventorySummary.outOfStockCount, color: "#22c55e" },
    { name: "Sắp hết", value: data.inventorySummary.lowStockCount, color: "#f59e0b" },
    { name: "Hết hàng", value: data.inventorySummary.outOfStockCount, color: "#ef4444" },
  ];

  const orderStatusData = Object.entries(data.orderStatusDistribution).map(([status, count]) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      'PENDING': { label: 'Chờ duyệt', color: '#94a3b8' },
      'CONFIRMED': { label: 'Đã xác nhận', color: '#3b82f6' },
      'DELIVERING': { label: 'Đang giao', color: '#f59e0b' },
      'DELIVERED': { label: 'Thành công', color: '#22c55e' },
      'CANCELLED': { label: 'Đã hủy', color: '#ef4444' },
    };
    return {
      name: statusMap[status]?.label || status,
      value: count,
      color: statusMap[status]?.color || '#cbd5e1'
    };
  });

  const customerLoyaltyData = [
    { name: "Khách hàng mới", value: data.newUsersCount, color: "#a855f7" },
    { name: "Khách quay lại", value: data.returningUsersCount, color: "#ec4899" },
  ];

  const categoryChartData = data.categoryDistribution.map((cat, i) => ({
    name: cat.category,
    value: cat.count,
    color: COLORS[i % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thống kê & Báo cáo</h1>
          <p className="text-muted-foreground">Phân tích hiệu suất kinh doanh và quản lý kho</p>
        </div>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
          Cập nhật {new Date().toLocaleTimeString()}
        </button>
      </div>

      {/* Filter Bar */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Khoảng thời gian nhanh</label>
                <Select value={quickFilter} onValueChange={handleQuickFilter}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Chọn khoảng thời gian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_7_days">7 ngày qua</SelectItem>
                    <SelectItem value="last_30_days">30 ngày qua (Mặc định)</SelectItem>
                    <SelectItem value="this_month">Tháng này</SelectItem>
                    <SelectItem value="this_year">Năm nay</SelectItem>
                    <SelectItem value="last_6_months">6 tháng qua</SelectItem>
                    <SelectItem value="custom" disabled className="hidden">Tùy chỉnh</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Ngày bắt đầu</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={startDate}
                    min={DATE_MIN}
                    max={endDate || getTodayStr()}
                    onChange={(e) => {
                      setStartDate(clampYear(e.target.value));
                      setQuickFilter("custom");
                    }}
                    className="bg-background pl-10"
                  />
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Ngày kết thúc</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate || DATE_MIN}
                    max={getTodayStr()}
                    onChange={(e) => {
                      setEndDate(clampYear(e.target.value));
                      setQuickFilter("custom");
                    }}
                    className="bg-background pl-10"
                  />
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <Button onClick={handleSearch} className="flex-1 lg:flex-none gap-2">
                <Search className="h-4 w-4" /> Tìm kiếm
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex-1 lg:flex-none gap-2">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportExcel}
                disabled={isExporting}
                className="flex-1 lg:flex-none gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 border border-border/50">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Tổng quan kinh doanh
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Warehouse className="h-4 w-4" /> Phân tích kho hàng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
            <SummaryCard title="Tổng doanh thu" value={data.totalRevenue} isCurrency icon={DollarSign} iconColor="text-emerald-500" />
            <SummaryCard title="Đơn hàng" value={data.totalOrders} icon={ShoppingCart} iconColor="text-blue-500" />
            <SummaryCard title="Khách hàng" value={data.totalUsers} icon={Users} iconColor="text-purple-500" />
            <SummaryCard title="Sản phẩm" value={data.totalProducts} icon={Package} iconColor="text-orange-500" />
            <SummaryCard title="AOV (Thành công)" value={data.averageOrderValue} isCurrency icon={TrendingUp} iconColor="text-blue-600" />
            <SummaryCard
              title="Tăng trưởng"
              value={data.revenueGrowthRate}
              isPercentage
              icon={TrendingUp}
              iconColor={data.revenueGrowthRate >= 0 ? "text-emerald-500" : "text-red-500"}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Trend Chart */}
            <Card className="hover:shadow-md transition-all border-border/50">
              <CardHeader>
                <CardTitle className="text-base font-bold">Doanh thu theo tháng</CardTitle>
                <CardDescription>Số liệu 6 tháng gần nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                      <YAxis tickFormatter={formatCompactCurrency} axisLine={false} tickLine={false} fontSize={12} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="hover:shadow-md transition-all border-border/50">
              <CardHeader>
                <CardTitle className="text-base font-bold">Top sản phẩm bán chạy</CardTitle>
                <CardDescription>Dựa trên tổng số lượng đã bán</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {data.topSellingProducts.map((product, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate leading-none mb-1.5">{product.name}</p>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000"
                            style={{
                              width: `${(product.quantity / (data.topSellingProducts[0]?.quantity || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                        {product.quantity} đã bán
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Order Status Chart */}
            <Card className="hover:shadow-md transition-all border-border/50">
              <CardHeader>
                <CardTitle className="text-base font-bold">Trạng thái đơn hàng</CardTitle>
                <CardDescription>Phân bổ trạng thái trong kỳ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => (percent || 0) > 0 ? `${name}: ${(Number(percent) * 100).toFixed(0)}%` : ""}
                        labelLine={false}
                        fontSize={12}
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Customer Loyalty Chart */}
            <Card className="hover:shadow-md transition-all border-border/50">
              <CardHeader>
                <CardTitle className="text-base font-bold">Lòng trung thành khách hàng</CardTitle>
                <CardDescription>Khách mới vs Khách quay lại trong kỳ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerLoyaltyData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => (percent || 0) > 0 ? `${name} ${(Number(percent) * 100).toFixed(0)}%` : ""}
                        labelLine={false}
                        fontSize={12}
                      >
                        {customerLoyaltyData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution Chart */}
            <Card className="hover:shadow-md transition-all border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-bold">Phân bổ đơn hàng theo danh mục</CardTitle>
                <CardDescription>Hiệu suất bán hàng theo từng nhóm sản phẩm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => (percent || 0) > 0 ? `${name}: ${(Number(percent) * 100).toFixed(0)}%` : ""}
                        labelLine={false}
                        fontSize={12}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [`${value} đơn`, 'Số lượng']}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              title="Sắp hết hàng"
              value={data.inventorySummary.lowStockCount}
              icon={AlertTriangle}
              iconColor="text-yellow-500"
              unit=" mặt hàng"
            />
            <SummaryCard
              title="Hết hàng"
              value={data.inventorySummary.outOfStockCount}
              icon={AlertTriangle}
              iconColor="text-red-500"
              unit=" mặt hàng"
            />
            <SummaryCard
              title="Tổng lượng tồn"
              value={data.inventorySummary.totalItems}
              icon={Package}
              iconColor="text-emerald-500"
              unit=" mục"
            />
          </div>

          <div className="grid gap-6">
            {/* Inventory Distribution Chart */}
            <Card className="hover:shadow-md transition-all border-border/50">
              <CardHeader>
                <CardTitle className="text-base font-bold">Tỷ lệ hàng trong kho</CardTitle>
                <CardDescription>Theo tình trạng tồn kho</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockStatusData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent, value }) => (value || 0) > 0 ? `${name} ${(Number(percent) * 100).toFixed(0)}%` : ""}
                        labelLine={false}
                        fontSize={12}
                      >
                        {stockStatusData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const SummaryCard = ({ title, value, isCurrency, isPercentage, unit = "", icon: Icon, iconColor = "text-primary" }: {
  title: string, value: number, isCurrency?: boolean, isPercentage?: boolean, unit?: string, icon?: React.ElementType, iconColor?: string
}) => (
  <Card className="hover:shadow-md transition-shadow relative overflow-hidden group border-border/50">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
        {Icon && <Icon className={cn("h-4 w-4", iconColor)} />}
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl font-black">
          {isCurrency
            ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", notation: 'compact' }).format(value)
            : isPercentage
              ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
              : value.toLocaleString()
          }
        </p>
        {unit && <span className="text-xs font-bold text-muted-foreground">{unit}</span>}
      </div>
    </CardContent>
    <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/10 group-hover:bg-primary transition-colors" />
  </Card>
);

export default Statistics;
