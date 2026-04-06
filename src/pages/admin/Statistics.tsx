import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  LineChart,
  Line,
  Legend,
} from "recharts";
import { mockOrders } from "../../data/mockOrders";
import { products } from "../../data/products";
import { cn } from "../../lib/utils";

const Statistics: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);
  // Revenue by month data
  const revenueData = [
    { month: "T8", revenue: 12500000 },
    { month: "T9", revenue: 18200000 },
    { month: "T10", revenue: 15800000 },
    { month: "T11", revenue: 22100000 },
    { month: "T12", revenue: 28500000 },
    { month: "T1", revenue: 19800000 },
  ];

  // Orders by status
  const ordersByStatus = [
    {
      name: "Chờ xác nhận",
      value: mockOrders.filter((o) => o.status === "pending").length,
      color: "#facc15",
    },
    {
      name: "Đã xác nhận",
      value: mockOrders.filter((o) => o.status === "confirmed").length,
      color: "#3b82f6",
    },
    {
      name: "Đang giao",
      value: mockOrders.filter((o) => o.status === "delivering").length,
      color: "#a855f7",
    },
    {
      name: "Đã giao",
      value: mockOrders.filter((o) => o.status === "delivered").length,
      color: "#22c55e",
    },
    {
      name: "Đã hủy",
      value: mockOrders.filter((o) => o.status === "cancelled").length,
      color: "#ef4444",
    },
  ];

  // Products by category
  const productsByCategory = [
    {
      category: "Chăm sóc da",
      count: products.filter((p) => p.category === "Chăm sóc da").length,
    },
    {
      category: "Trang điểm",
      count: products.filter((p) => p.category === "Trang điểm").length,
    },
    {
      category: "Chăm sóc tóc",
      count: products.filter((p) => p.category === "Chăm sóc tóc").length,
    },
  ];

  // Top selling products (mock data)
  const topProducts = [
    { name: "Serum Vitamin C", sales: 156 },
    { name: "Kem Chống Nắng SPF50+", sales: 142 },
    { name: "Son Kem Lì Đỏ Cherry", sales: 128 },
    { name: "Nước Tẩy Trang", sales: 98 },
    { name: "Kem Dưỡng Ẩm 72H", sales: 87 },
  ];

  // Daily orders trend
  const dailyOrders = [
    { day: "T2", orders: 12 },
    { day: "T3", orders: 19 },
    { day: "T4", orders: 15 },
    { day: "T5", orders: 22 },
    { day: "T6", orders: 28 },
    { day: "T7", orders: 35 },
    { day: "CN", orders: 18 },
  ];

  const formatCurrency = (value: number) => {
    return (
      new Intl.NumberFormat("vi-VN", {
        notation: "compact",
        compactDisplay: "short",
      }).format(value) + "đ"
    );
  };

  const totalRevenue = mockOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const avgOrderValue =
    totalRevenue / mockOrders.filter((o) => o.status !== "cancelled").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Thống kê</h1>
        <p className="text-muted-foreground">
          Báo cáo doanh thu và hiệu suất kinh doanh
        </p>
      </div>

      {/* Summary Cards */}
      <div className={cn("grid gap-4 md:grid-cols-4 transition-all duration-500", isLoading ? "opacity-30 translate-y-4" : "opacity-100 translate-y-0")}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6 text-center lg:text-left">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6 text-center lg:text-left">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Giá trị đơn TB</p>
            <p className="text-2xl font-bold mt-1">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(avgOrderValue)}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6 text-center lg:text-left">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tổng đơn hàng</p>
            <p className="text-2xl font-bold mt-1">{mockOrders.length}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6 text-center lg:text-left">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tỷ lệ hoàn thành</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {Math.round(
                (mockOrders.filter((o) => o.status === "delivered").length /
                  mockOrders.length) *
                  100,
              )}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="hover:shadow-lg transition-all border-primary/10">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Doanh thu theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value) =>
                      new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(Number(value))
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status Pie Chart */}
        <Card className="hover:shadow-lg transition-all border-primary/10">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Đơn hàng theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Orders Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng đơn hàng theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyOrders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    name="Đơn hàng"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(product.sales / topProducts[0].sales) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {product.sales} đã bán
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm theo danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productsByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={120} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name="Số sản phẩm"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistics;
