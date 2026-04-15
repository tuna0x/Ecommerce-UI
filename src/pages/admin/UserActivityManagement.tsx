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
  Monitor,
  SearchX
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
import { Switch } from "../../components/ui/switch";
import { getAllLogs, getAnalytics } from "../../service/trackingService";
import PaginationControl from "../../components/PaginationControl";

// New Components
import AnalyticsCards from "../../components/admin/tracking/AnalyticsCards";
import AnalyticsCharts from "../../components/admin/tracking/AnalyticsCharts";
import SessionTimeline from "../../components/admin/tracking/SessionTimeline";
import { useDebounce } from "../../hooks/useDebounce";

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
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(200);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

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
      let filter = debouncedSearchTerm ? `userEmail~'${debouncedSearchTerm}'` : "";
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
  }, [debouncedSearchTerm, actionFilter, pageSize]);

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage, fetchLogs]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, actionFilter]);

  useEffect(() => {
    let interval: any;
    if (isAutoRefresh) {
      interval = setInterval(() => {
        if (!isLoading && !isAnalyticsLoading) {
           fetchLogs(currentPage);
           fetchAnalytics();
        }
      }, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [isAutoRefresh, currentPage, isLoading, isAnalyticsLoading, fetchLogs, fetchAnalytics]);

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
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full border border-border/50">
                <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Tự động làm mới</span>
                <Switch 
                  checked={isAutoRefresh} 
                  onCheckedChange={setIsAutoRefresh} 
                  className="scale-75 data-[state=checked]:bg-green-500" 
                />
            </div>
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
                 <div className="flex gap-2 items-center">
                    <div className="relative group">
                       <Input 
                         placeholder="Tìm email khách..." 
                         className="h-8 max-w-[200px] pl-8 pr-8" 
                         value={searchTerm} 
                         onChange={(e) => setSearchTerm(e.target.value)}
                       />
                       <SearchIcon className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                       {searchTerm && (
                         <button 
                           onClick={() => setSearchTerm("")}
                           className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                         >
                           <X className="h-3 w-3" />
                         </button>
                       )}
                    </div>
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
                  <div className="relative flex-1 group">
                    <Search className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                      isLoading ? "text-primary animate-pulse" : "text-muted-foreground group-focus-within:text-primary"
                    )} />
                    <Input
                      placeholder="Tìm email khách hàng..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10 h-10"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
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
                              <User className={cn("h-4 w-4", !log.userEmail ? "text-orange-500" : "text-muted-foreground")} />
                              <div>
                                <p className={cn("text-sm font-medium", !log.userEmail && "text-orange-600 font-bold italic")}>
                                    {log.userEmail || `Guest_${log.sessionId.slice(0, 6)}`}
                                </p>
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
                          <td className="py-3 px-4 max-w-[300px]">
                            {(() => {
                              try {
                                const meta = JSON.parse(log.metadata);
                                if (log.actionType === 'TIME_ON_PAGE') {
                                  const seconds = Math.floor(meta.durationMs / 1000);
                                  const durationText = seconds >= 60 
                                    ? `${Math.floor(seconds / 60)} phút ${seconds % 60} giây` 
                                    : `${(meta.durationMs / 1000).toFixed(1)} giây`;
                                  return (
                                    <div className="flex items-center gap-2 group cursor-help">
                                      <Clock className="h-3 w-3 text-blue-500 shrink-0" />
                                      <span className="text-xs font-semibold text-blue-600">Ở lại: {durationText}</span>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">({meta.path})</span>
                                          </TooltipTrigger>
                                          <TooltipContent>{meta.path}</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  );
                                }
                                if (log.actionType === 'PURCHASE') {
                                  return (
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <ShoppingBag className="h-3 w-3 text-green-500" />
                                        <span className="text-xs font-bold text-green-700">Đơn hàng #{meta.orderId}</span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground italic pl-4">PTTT: {meta.method}</span>
                                    </div>
                                  );
                                }
                                if (log.actionType === 'BEGIN_CHECKOUT') {
                                  return (
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1.5 font-semibold text-orange-700">
                                        <Activity className="h-3 w-3" />
                                        <span className="text-xs">Checkout: {new Intl.NumberFormat('vi-VN').format(meta.cartTotal)}₫</span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground pl-4">({meta.itemCount} sản phẩm)</span>
                                    </div>
                                  );
                                }
                                if (log.actionType === 'ADD_CART' || log.actionType === 'UPDATE_CART') {
                                  return (
                                    <div className="flex items-center gap-1.5">
                                      <ShoppingCart className="h-3 w-3 text-emerald-500" />
                                      <span className="text-xs font-medium">{meta.productName || 'Cập nhật giỏ hàng'}</span>
                                    </div>
                                  );
                                }
                                return (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="text-[10px] text-muted-foreground truncate cursor-help bg-muted/50 p-1 px-2 rounded font-mono">
                                          {log.metadata}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-[300px] break-all text-[10px]">
                                        {log.metadata}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              } catch (e) {
                                return <span className="text-xs font-mono text-muted-foreground">{log.metadata}</span>;
                              }
                            })()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="text-xs font-medium tabular-nums">{formatDateTime(log.createdAt)}</div>
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && !isLoading && (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <div className="flex flex-col items-center justify-center max-w-[200px] mx-auto text-muted-foreground">
                              <div className="relative mb-4">
                                <SearchX className="w-12 h-12 opacity-20" />
                                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm">
                                  <Clock className="w-4 h-4 text-primary animate-spin-slow" />
                                </div>
                              </div>
                              <p className="font-semibold text-foreground">Không tìm thấy nhật ký</p>
                              <p className="text-xs mt-1 text-center">Không có hành động nào phù hợp với bộ lọc hiện tại</p>
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
