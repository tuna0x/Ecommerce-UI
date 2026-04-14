import React, { useEffect, useState, useCallback } from "react";
import { Search, Eye, User, Activity, Clock, Loader2, MousePointer2, ShoppingCart, ShoppingBag, X, Search as SearchIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  Card,
  CardContent,
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
import { toast } from "sonner";
import { getAllLogs } from "../../service/trackingService";
import PaginationControl from "../../components/PaginationControl";

interface IUserActivityLog {
  id: number;
  userEmail: string;
  actionType: string;
  metadata: string;
  ipAddress: string;
  createdAt: string;
}

const UserActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<IUserActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(15);
  const [totalElements, setTotalElements] = useState(0);

  const fetchLogs = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      let filter = searchTerm ? `userEmail~'${searchTerm}'` : "";
      if (actionFilter !== "all") {
        filter = filter ? `${filter} and actionType:'${actionFilter}'` : `actionType:'${actionFilter}'`;
      }

      const res = await getAllLogs(page - 1, pageSize, filter || undefined);
      if (res.data) {
        setLogs(res.data.result || []);
        setTotalPages(res.data.meta?.pages || 1);
        setTotalElements(res.data.meta?.total || 0);
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
      case 'ADD_CART': return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'REMOVE_CART': return <X className="h-4 w-4 text-red-500" />;
      case 'PURCHASE': return <ShoppingBag className="h-4 w-4 text-amber-500" />;
      case 'SEARCH': return <SearchIcon className="h-4 w-4 text-purple-500" />;
      case 'TIME_ON_PAGE': return <Clock className="h-4 w-4 text-gray-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'PURCHASE': return "bg-amber-100 text-amber-700 border-amber-200";
      case 'ADD_CART': return "bg-green-100 text-green-700 border-green-200";
      case 'VIEW_PRODUCT': return "bg-blue-100 text-blue-700 border-blue-200";
      case 'SEARCH': return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nhật ký hành vi</h1>
          <p className="text-muted-foreground">Theo dõi hành động của người dùng trên toàn bộ hệ thống</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalElements}</div>
            <p className="text-sm text-muted-foreground">Tổng số sự kiện</p>
          </CardContent>
        </Card>
        {/* Placeholder for more stats if needed */}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm email khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>Lọc</Button>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full lg:w-[250px]">
                <SelectValue placeholder="Loại hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hành động</SelectItem>
                <SelectItem value="VIEW_PRODUCT">Xem sản phẩm</SelectItem>
                <SelectItem value="CLICK_PRODUCT">Click sản phẩm</SelectItem>
                <SelectItem value="ADD_CART">Thêm giỏ hàng</SelectItem>
                <SelectItem value="REMOVE_CART">Xóa giỏ hàng</SelectItem>
                <SelectItem value="SEARCH">Tìm kiếm</SelectItem>
                <SelectItem value="PURCHASE">Mua hàng</SelectItem>
                <SelectItem value="TIME_ON_PAGE">Thời gian trên trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className={cn("relative", isLoading ? "opacity-50" : "opacity-100")}>
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center -top-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground">Khách hàng</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground">Hành động</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground">Thông tin bổ sung</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground text-right">Thời gian</th>
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
                      <td className="py-3 px-4 max-w-[300px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-xs text-muted-foreground truncate cursor-help bg-muted/50 p-1 px-2 rounded font-mono">
                                {log.metadata}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[400px] p-2 bg-card border shadow-lg text-xs leading-relaxed break-all">
                              <div className="font-bold mb-1 border-b pb-1">Raw Metadata:</div>
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
                      <td colSpan={4} className="text-center py-20 text-muted-foreground italic">
                        Chưa có dữ liệu hành vi nào được ghi nhận
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
    </div>
  );
};

export default UserActivityLog;
