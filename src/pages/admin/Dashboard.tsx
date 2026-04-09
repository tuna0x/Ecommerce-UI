import React, { useEffect, useState } from 'react';
import {
  ShoppingCart, Users, DollarSign,
  TrendingUp, TrendingDown, ArrowUpRight, AlertTriangle, Loader2, RefreshCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dashboardService, type StatisticsData } from '../../service/dashboardService';
import { Button } from '../../components/ui/button';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#6366f1'];

const Dashboard: React.FC = () => {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const stats = await dashboardService.getStatistics();
      setData(stats);
      setError(null);
    } catch (err) {
      console.error("Fetch dashboard data failed:", err);
      setError("Không thể tải dữ liệu dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const getStatusBadge = (status: string) => {
    const statusKey = status.toUpperCase();
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      DELIVERING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    const labels: Record<string, string> = {
      PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', DELIVERING: 'Đang giao',
      DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[statusKey] || styles.PENDING}`}>
        {labels[statusKey] || status}
      </span>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Đang tải dữ liệu dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Lỗi tải dữ liệu</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchData} className="gap-2">
          <RefreshCcw className="h-4 w-4" /> Thử lại
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const totalOrders = data.totalOrders;
  const cancelledOrders = data.orderStatusDistribution['CANCELLED'] || 0;
  const validOrders = totalOrders - cancelledOrders;
  const pendingOrders = data.orderStatusDistribution['PENDING'] || 0;
  
  const conversionRate = validOrders > 0 
    ? ((data.orderStatusDistribution['DELIVERED'] || 0) / validOrders * 100).toFixed(1)
    : "0.0";

  const categoryChartData = data.categoryDistribution.map((cat, i) => ({
    name: cat.category,
    value: cat.count,
    color: COLORS[i % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Tổng quan về cửa hàng của bạn</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Làm mới
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {data.revenueGrowthRate >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{data.revenueGrowthRate.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{data.revenueGrowthRate.toFixed(1)}%</span>
                </>
              )}
              so với kỳ trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đơn hàng</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{data.totalOrders}</div>
            <p className="text-xs text-muted-foreground">{pendingOrders} đơn đang chờ xử lý</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ giao thành công</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-green-600">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Tỉ lệ đơn hoàn thành</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{data.totalUsers}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="text-primary">{data.newUsersCount}</span> khách mới kỳ này
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Doanh thu theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor', opacity: 0.5 }} />
                  <YAxis tickFormatter={formatShortCurrency} className="text-xs" tick={{ fill: 'currentColor', opacity: 0.5 }} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value), 'Doanh thu'] as [string, string]}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Đơn hàng theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryChartData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {categoryChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} đơn`, 'Số lượng'] as [string, string]} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Low Stock */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topSellingProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis
                    dataKey="name" type="category" width={120}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
                  />
                  <Tooltip formatter={(value: any) => [`${value} đã bán`, 'Số lượng'] as [string, string]} />
                  <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Cảnh báo tồn kho thấp
            </CardTitle>
            <Link to="/admin/inventory" className="text-sm text-primary flex items-center gap-1 hover:underline">
              Xem kho <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {data.lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
                    <img src={p.image || '/placeholder.png'} alt={p.name} className="h-10 w-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Còn {p.stock} sản phẩm</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Tất cả sản phẩm đều đủ hàng 🎉</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Đơn hàng gần đây</CardTitle>
          <Link to="/admin/orders" className="text-sm text-primary flex items-center gap-1 hover:underline">
            Xem tất cả <ArrowUpRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Mã đơn</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Mã giao dịch</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground hidden sm:table-cell">Khách hàng</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Tổng tiền</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-3 px-2 text-sm font-medium">#{order.id}</td>
                    <td className="py-3 px-2 text-sm font-mono text-muted-foreground">{order.transactionId}</td>
                    <td className="py-3 px-2 text-sm hidden sm:table-cell">{order.customerName}</td>
                    <td className="py-3 px-2 text-sm">{formatCurrency(order.total)}</td>
                    <td className="py-3 px-2">{getStatusBadge(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
