import React, { useEffect, useState, useCallback } from "react";
import { 
  Search, 
  Eye, 
  User, 
  Activity, 
  Clock, 
  Loader2, 
  MousePointer2, 
  ShoppingCart, 
  ShoppingBag, 
  X, 
  Search as SearchIcon,
  LayoutDashboard,
  History,
  Table as TableIcon,
  RefreshCcw,
  Monitor
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { toast } from "sonner";
import { getAllLogs, getAnalytics } from "../../service/trackingService";
import PaginationControl from "../../components/PaginationControl";

// New Components
import AnalyticsCards from "../../components/admin/tracking/AnalyticsCards";
import AnalyticsCharts from "../../components/admin/tracking/AnalyticsCharts";
import SessionTimeline from "../../components/admin/tracking/SessionTimeline";

interface IUserBehavior {
  id: number;
  userEmail: string;
  actionType: string;
  metadata: string;
  ipAddress: string;
  createdAt: string;
  sessionId: string;
  deviceType: string;
  referrer: string;
  pageUrl: string;
}

const UserActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<IUserBehavior[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(15);

  const fetchAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    try {
      const res = await getAnalytics(7);
      setAnalyticsData(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải dữ liệu phân tích");
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      let filter = searchTerm ? `userEmail~'${searchTerm}'` : "";
      if (actionFilter !== "all") {
        filter = filter ? `${filter} and actionType:'${actionFilter}'` : `actionType:'${actionFilter}'`;
      }

      const res = await getAllLogs(page - 1, pageSize, filter || undefined);
      const data = res?.data?.data;
      if (data) {
        setLogs(data.result || []);
        setTotalPages(data.meta?.pages || 1);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải nhật ký hoạt động");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, actionFilter, pageSize]);

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage, fetchLogs]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs(1);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'VIEW_PRODUCT': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'CLICK_PRODUCT': return <MousePointer2 className="h-4 w-4 text-indigo-500" />;
      case 'VIEW_CATEGORY': return <Activity className="h-4 w-4 text-cyan-500" />;
      case 'ADD_CART': return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'REMOVE_CART': return <X className="h-4 w-4 text-red-500" />;
      case 'UPDATE_CART': return <Activity className="h-4 w-4 text-emerald-500" />;
      case 'PURCHASE': return <ShoppingBag className="h-4 w-4 text-amber-500" />;
      case 'BEGIN_CHECKOUT': return <Activity className="h-4 w-4 text-orange-500" />;
      case 'SEARCH': return <SearchIcon className="h-4 w-4 text-purple-500" />;
      case 'TIME_ON_PAGE': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'USE_COUPON': return <Activity className="h-4 w-4 text-pink-500" />;
      case 'CHAT_WITH_BOT': return <Activity className="h-4 w-4 text-rose-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'PURCHASE': return "bg-amber-100 text-amber-700 border-amber-200";
      case 'BEGIN_CHECKOUT': return "bg-orange-100 text-orange-700 border-orange-200";
      case 'ADD_CART': case 'UPDATE_CART': return "bg-green-100 text-green-700 border-green-200";
      case 'VIEW_PRODUCT': case 'VIEW_CATEGORY': return "bg-blue-100 text-blue-700 border-blue-200";
      case 'SEARCH': return "bg-purple-100 text-purple-700 border-purple-200";
      case 'CHAT_WITH_BOT': return "bg-rose-100 text-rose-700 border-rose-200";
      case 'USE_COUPON': return "bg-pink-100 text-pink-700 border-pink-200";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Phân tích hành vi</h1>
          <p className="text-muted-foreground">Theo dõi và tối ưu hóa trải nghiệm khách hàng</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { fetchAnalytics(); fetchLogs(1); }} className="gap-2">
                <RefreshCcw className={cn("h-4 w-4", (isAnalyticsLoading || isLoading) && "animate-spin")} />
                Làm mới
            </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-8">
          <TabsTrigger value="dashboard" className="gap-2">
             <LayoutDashboard className="h-4 w-4" /> Tổng quan
          </TabsTrigger>
          <TabsTrigger value="journey" className="gap-2">
             <History className="h-4 w-4" /> Hành trình
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
             <TableIcon className="h-4 w-4" /> Nhật ký
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <AnalyticsCards data={analyticsData} loading={isAnalyticsLoading} />
          
          <AnalyticsCharts 
            distribution={analyticsData?.actionDistribution || []} 
            trend={analyticsData?.activityTrend || []} 
            loading={isAnalyticsLoading} 
          />
        </TabsContent>

        <TabsContent value="journey" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <Card>
             <CardHeader className="pb-3 border-b">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Monitor className="h-4 w-4" /> Hành trình theo phiên làm việc
                 </CardTitle>
                 <div className="flex gap-2">
                    <Input 
                      placeholder="Tìm email khách..." 
                      className="h-8 max-w-[200px]" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button size="sm" variant="secondary" onClick={handleSearch} className="h-8">Tìm</Button>
                 </div>
               </div>
             </CardHeader>
             <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                     <p className="text-xs text-muted-foreground italic">Đang sắp xếp hành trình...</p>
                  </div>
                ) : (
                  <SessionTimeline logs={logs} />
                )}
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="logs" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm email khách hàng..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10 h-10"
                    />
                  </div>
                  <Button onClick={handleSearch} className="h-10">Lọc</Button>
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-full lg:w-[250px] h-10">
                    <SelectValue placeholder="Loại hành động" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả hành động</SelectItem>
                    <SelectItem value="VIEW_PRODUCT">Xem sản phẩm</SelectItem>
                    <SelectItem value="CLICK_PRODUCT">Click sản phẩm</SelectItem>
                    <SelectItem value="VIEW_CATEGORY">Xem danh mục</SelectItem>
                    <SelectItem value="ADD_CART">Thêm giỏ hàng</SelectItem>
                    <SelectItem value="REMOVE_CART">Xóa giỏ hàng</SelectItem>
                    <SelectItem value="UPDATE_CART">Cập nhật giỏ</SelectItem>
                    <SelectItem value="SEARCH">Tìm kiếm</SelectItem>
                    <SelectItem value="BEGIN_CHECKOUT">Bắt đầu thanh toán</SelectItem>
                    <SelectItem value="PURCHASE">Mua hàng thành công</SelectItem>
                    <SelectItem value="TIME_ON_PAGE">Thời gian trên trang</SelectItem>
                    <SelectItem value="USE_COUPON">Dùng mã giảm giá</SelectItem>
                    <SelectItem value="CHAT_WITH_BOT">Chat với AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={cn("relative", isLoading ? "opacity-50" : "opacity-100")}>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground whitespace-nowrap">Khách hàng</th>
                        <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground whitespace-nowrap">Hành động</th>
                        <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground whitespace-nowrap">Vị trí</th>
                        <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground whitespace-nowrap">Metadata</th>
                        <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground text-right whitespace-nowrap">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{log.userEmail}</p>
                                <p className="text-[10px] text-muted-foreground tabular-nums">{log.ipAddress}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={cn("text-[10px] uppercase font-bold flex items-center gap-1 w-fit", getActionBadgeColor(log.actionType))}>
                              {getActionIcon(log.actionType)}
                              {log.actionType.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                             <div className="text-[10px] text-muted-foreground max-w-[120px] truncate" title={log.pageUrl}>
                                 {log.pageUrl || 'N/A'}
                             </div>
                          </td>
                          <td className="py-3 px-4 max-w-[250px]">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs text-muted-foreground truncate cursor-help bg-muted/50 p-1 px-2 rounded font-mono">
                                    {log.metadata}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[400px] p-2 bg-card border shadow-lg text-xs leading-relaxed break-all">
                                  <div className="font-bold mb-1 border-b pb-1">Chi tiết JSON:</div>
                                  {log.metadata}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="text-xs font-medium tabular-nums">{formatDateTime(log.createdAt)}</div>
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && !isLoading && (
                        <tr>
                          <td colSpan={5} className="text-center py-20 text-muted-foreground italic">
                            Chưa có dữ liệu nhật ký nào phù hợp
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="p-4 border-t bg-muted/10">
                    <PaginationControl
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserActivityLog;
