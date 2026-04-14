import { 
  Activity, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Clock 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../../lib/utils';

interface AnalyticsCardsProps {
  data: {
    totalEvents: number;
    totalSessions: number;
    activeUsers: number;
    totalPurchases: number;
    totalAddToCart: number;
    conversionRate: number;
  } | null;
  loading: boolean;
}

const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ data, loading }) => {
  const stats = [
    {
      title: "Tổng số sự kiện",
      value: data?.totalEvents ?? 0,
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      description: "Hành động ghi nhận"
    },
    {
      title: "Khách truy cập",
      value: data?.activeUsers ?? 0,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      description: "Users duy nhất"
    },
    {
      title: "Phiên làm việc",
      value: data?.totalSessions ?? 0,
      icon: Clock,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      description: "Sessions định danh"
    },
    {
      title: "Thêm giỏ hàng",
      value: data?.totalAddToCart ?? 0,
      icon: ShoppingCart,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      description: "Tăng trưởng giỏ"
    },
    {
      title: "Tỷ lệ chuyển đổi",
      value: `${data?.conversionRate ?? 0}%`,
      icon: TrendingUp,
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      description: "Sessions mua hàng"
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      {stats.map((stat, i) => (
        <Card key={i} className={cn("overflow-hidden border-none shadow-sm", loading && "animate-pulse")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {stat.title}
            </CardTitle>
            <div className={cn("p-2 rounded-lg", stat.bgColor)}>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stat.value}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnalyticsCards;
