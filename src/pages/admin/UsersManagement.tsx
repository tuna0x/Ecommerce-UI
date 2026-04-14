import React, { useEffect, useState, useCallback } from "react";
import { Search, UserCog, Loader2, Eye, TrendingUp, History, ShieldCheck, Mail, Calendar, MapPin, Activity, Clock, Gift, X, UserX } from "lucide-react";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { AccessControl } from "../../components/auth/AccessControl";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Textarea } from "../../components/ui/textarea";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { toast } from "sonner";
import { UserService } from "../../service/userService";
import { RoleService } from "../../service/roleService";
import type { IUser, IUserAnalytics } from "../../types/user.type";
import type { IRole } from "../../types/role.type";
import PaginationControl from "../../components/PaginationControl";
import { useDebounce } from "../../hooks/useDebounce";

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pendingRoleChange, setPendingRoleChange] = useState<{ user: IUser; newRoleId: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New states for Customer 360
  const [analyticsUser, setAnalyticsUser] = useState<IUser | null>(null);
  const [analyticsData, setAnalyticsData] = useState<IUserAnalytics | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const fetchUsers = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      // Build filter
      let filter = debouncedSearchTerm ? `(name~'${debouncedSearchTerm}' or email~'${debouncedSearchTerm}')` : "";
      if (roleFilter !== "all") {
        filter = filter ? `${filter} and role.name:'${roleFilter}'` : `role.name:'${roleFilter}'`;
      }

      const res = await UserService.getAll(page, pageSize, filter || undefined);
      if (res.data) {
        setUsers(res.data.result || (Array.isArray(res.data) ? res.data : []));
        setTotalPages(res.data.meta?.pages || 1);
        setTotalElements(res.data.meta?.total || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, roleFilter, pageSize]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await RoleService.getAll();
      if (res.data) {
        setRoles(res.data.result);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchUsers(currentPage);
    fetchRoles();
  }, [currentPage, fetchUsers, fetchRoles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, roleFilter]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleRoleChange = (user: IUser, roleId: string) => {
    setPendingRoleChange({ user, newRoleId: roleId });
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    const { user, newRoleId } = pendingRoleChange;
    try {
      await UserService.updateRole(user.id, parseInt(newRoleId));
      toast.success(`Đã cập nhật vai trò cho ${user.name}`);
      fetchUsers(currentPage);
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật vai trò thất bại");
    } finally {
      setPendingRoleChange(null);
    }
  };

  const toggleUserStatus = useCallback(async (user: IUser) => {
    try {
      await UserService.toggleActive(user.id, !user.active);
      toast.success("Đã cập nhật trạng thái người dùng");
      fetchUsers(currentPage);
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật trạng thái thất bại");
    }
  }, [fetchUsers, currentPage]);

  const viewUserAnalytics = async (user: IUser) => {
    setAnalyticsUser(user);
    setIsAnalyticsLoading(true);
    try {
      const res = await UserService.getAnalytics(user.id);
      if (res.data) {
        setAnalyticsData(res.data);
        setAdminNotes(res.data.adminNotes || "");
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thông tin phân tích người dùng");
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const saveAdminNotes = async () => {
    if (!analyticsUser) return;
    try {
      await UserService.updateAdminNotes(analyticsUser.id, adminNotes);
      toast.success("Đã lưu ghi chú Admin");
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu ghi chú");
    }
  };

  const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý người dùng
          </h1>
          <p className="text-muted-foreground">
            Xem danh sách và phân quyền người dùng
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalElements}</div>
            <p className="text-sm text-muted-foreground">Tổng người dùng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role?.name === "SUPER_ADMIN").length}
            </div>
            <p className="text-sm text-muted-foreground">Admin (trang này)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {users.filter((u) => u.active).length}
            </div>
            <p className="text-sm text-muted-foreground">Đang hoạt động (trang này)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-sm relative group">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                isLoading ? "text-primary animate-pulse" : "text-muted-foreground group-focus-within:text-primary"
              )} />
              <Input
                placeholder="Tìm kiếm theo tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="SUPER_ADMIN">Admin</SelectItem>
                <SelectItem value="ROLE_USER">Người dùng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng ({totalElements})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("relative", isLoading ? "opacity-50" : "opacity-100")}>
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center -top-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <div className="overflow-x-auto border rounded-lg bg-card">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Người dùng
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Tuổi/Địa chỉ
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Vai trò
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Trạng thái
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-all group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border border-border/50">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                              {user.name && user.name.length > 0 ? user.name.charAt(0).toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{user.age ?? 'N/A'}</span> tuổi
                      </td>
                      <td className="py-4 px-4">
                        <Select
                          value={user.role?.id.toString()}
                          onValueChange={(value) => handleRoleChange(user, value)}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-[10px] font-bold uppercase tracking-wider">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((r) => (
                              <SelectItem key={r.id} value={r.id.toString()} className="text-[10px] font-bold uppercase">
                                {r.name === "SUPER_ADMIN" ? "Admin" : r.name === "ROLE_USER" ? "Người dùng" : r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-bold tracking-wider",
                            user.active
                              ? "border-green-500 text-green-600 bg-green-50"
                              : "border-destructive text-destructive bg-destructive/10"
                          )}
                        >
                          {user.active ? "Hoạt động" : "Bị khóa"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1">


                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Xem chi tiết 360 độ"
                            onClick={() => viewUserAnalytics(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <AccessControl module="USERS" action="TOGGLE_STATUS">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 transition-colors"
                              title={
                                user.active
                                  ? "Vô hiệu hóa"
                                  : "Kích hoạt"
                              }
                              onClick={() => toggleUserStatus(user)}
                            >
                              <UserCog className={`h-4 w-4 ${user.active ? "text-muted-foreground" : "text-destructive font-bold"}`} />
                            </Button>
                          </AccessControl>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center max-w-[200px] mx-auto text-muted-foreground">
                          <div className="relative mb-4">
                             <UserX className="w-12 h-12 opacity-20" />
                             <Search className="w-6 h-6 absolute -bottom-1 -right-1 text-primary animate-bounce" />
                          </div>
                          <p className="font-semibold text-foreground">Không tìm thấy kết quả</p>
                          <p className="text-xs mt-1 text-center">Vui lòng thử lại với từ khóa hoặc bộ lọc khác</p>
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

      {/* Confirm Role Change Dialog */}
      <AlertDialog
        open={!!pendingRoleChange}
        onOpenChange={(open) => !open && setPendingRoleChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay đổi vai trò</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn thay đổi vai trò của <strong>{pendingRoleChange?.user.name}</strong> 
              từ <span className="font-bold text-primary">{pendingRoleChange?.user.role?.name === "SUPER_ADMIN" ? "Admin" : pendingRoleChange?.user.role?.name === "ROLE_USER" ? "Người dùng" : pendingRoleChange?.user.role?.name}</span>{' '}
              sang <span className="font-bold text-green-600">{roles.find(r => r.id.toString() === pendingRoleChange?.newRoleId)?.name === "SUPER_ADMIN" ? "Admin" : roles.find(r => r.id.toString() === pendingRoleChange?.newRoleId)?.name === "ROLE_USER" ? "Người dùng" : roles.find(r => r.id.toString() === pendingRoleChange?.newRoleId)?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingRoleChange(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary hover:bg-primary/90"
              onClick={confirmRoleChange}
            >
              Xác nhận thay đổi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      {/* Customer 360 View Dialog */}
      <Dialog open={!!analyticsUser} onOpenChange={() => { setAnalyticsUser(null); setAnalyticsData(null); }}>
        <DialogContent className="max-w-4xl h-[750px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <div className="flex items-center gap-4">
               <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarImage src={analyticsUser?.image} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {analyticsUser?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-1">{analyticsUser?.name}</DialogTitle>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline" className="bg-muted/50">{analyticsUser?.email}</Badge>
                  {analyticsData?.autoTags?.map(tag => (
                    <Badge key={tag} className={cn(
                      "text-[10px] font-bold uppercase",
                      tag === 'VIP' ? "bg-amber-500" : 
                      tag === 'Nguy cơ' ? "bg-red-500" : 
                      tag === 'Mới' ? "bg-blue-500" : "bg-green-500"
                    )}>{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Tham gia từ</p>
                <p className="font-semibold">{formatDate(analyticsUser?.createdAt)}</p>
              </div>
            </div>
          </DialogHeader>

          {isAnalyticsLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse font-medium">Đang tổng hợp dữ liệu 360°...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="overview" className="h-full flex flex-col">
                <div className="px-6 border-b shrink-0">
                  <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-semibold">Tổng quan</TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-semibold">Dòng thời gian</TabsTrigger>
                    <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-semibold">Bảo mật</TabsTrigger>
                    <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-semibold text-orange-500">Ghi chú Admin</TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <TabsContent value="overview" className="m-0 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card className="bg-primary/5 border-none">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                              <TrendingUp className="w-8 h-8 text-primary" />
                              <Badge className="bg-primary">Giá trị trọn đời (LTV)</Badge>
                            </div>
                            <div className="text-3xl font-bold text-primary">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(analyticsData?.lifetimeValue || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Dựa trên tổng giá trị đơn hàng đã hoàn thành</p>
                          </CardContent>
                        </Card>

                        <Card className="bg-blue-50 dark:bg-blue-950/20 border-none">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                              <Calendar className="w-8 h-8 text-blue-500" />
                              <Badge variant="outline" className="text-blue-500 border-blue-500">Tần suất mua</Badge>
                            </div>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                              {analyticsData?.totalOrders || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 text-blue-700/60 dark:text-blue-300/60">Tổng số đơn hàng đã đặt trong hệ thống</p>
                          </CardContent>
                        </Card>

                        <Card className="md:col-span-2 lg:col-span-1 border-dashed">
                          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between mb-2">
                             <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Phân bổ đơn hàng</CardTitle>
                          </CardHeader>
                          <div className="h-[120px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={Object.entries(analyticsData?.orderStatusDistribution || {}).map(([name, value]) => ({ name, value }))}
                                  innerRadius={30}
                                  outerRadius={50}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {Object.entries(analyticsData?.orderStatusDistribution || {}).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Trạng thái tài khoản
                         </h3>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-3 rounded-lg border bg-card">
                               <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Email</p>
                               <div className="flex items-center gap-2">
                                  {analyticsUser?.verified ? (
                                    <Badge className="bg-green-500">Đã xác thực</Badge>
                                  ) : (
                                    <Badge variant="destructive">Chưa xác thực</Badge>
                                  )}
                               </div>
                            </div>
                            <div className="p-3 rounded-lg border bg-card">
                               <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Hoạt động</p>
                               <div className="flex items-center gap-2">
                                  {analyticsUser?.active ? (
                                    <Badge className="bg-green-500">Active</Badge>
                                  ) : (
                                    <Badge variant="destructive">Locked</Badge>
                                  )}
                               </div>
                            </div>
                            <div className="p-3 rounded-lg border bg-card col-span-2">
                               <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Đăng nhập cuối</p>
                               <p className="text-sm font-semibold">{analyticsData?.lastLoginAt ? formatDate(analyticsData.lastLoginAt) : 'Chưa có dữ liệu'}</p>
                            </div>
                         </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="activity" className="m-0">
                      <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                        {analyticsData?.recentActivities && analyticsData.recentActivities.length > 0 ? (
                           analyticsData.recentActivities.map((activity, idx) => (
                            <div key={idx} className="relative group">
                              <div className="absolute -left-[30px] top-1 h-5 w-5 rounded-full border-4 border-background bg-primary z-10 group-hover:scale-125 transition-transform" />
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block w-fit",
                                    activity.action.includes('PURCHASE') ? "bg-green-100 text-green-700" :
                                    activity.action.includes('VIEW') ? "bg-blue-100 text-blue-700" :
                                    "bg-muted text-muted-foreground"
                                )}>
                                  {activity.action}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {new Date(activity.timestamp).toLocaleString('vi-VN')}
                                </span>
                              </div>
                              <div className="mt-1">
                                {(() => {
                                  try {
                                    const meta = JSON.parse(activity.metadata);
                                    if (activity.action === 'TIME_ON_PAGE') {
                                      const seconds = Math.floor(meta.durationMs / 1000);
                                      const durationText = seconds >= 60 
                                        ? `${Math.floor(seconds / 60)} phút ${seconds % 60} giây` 
                                        : `${(meta.durationMs / 1000).toFixed(1)} giây`;
                                      return (
                                        <div className="text-sm space-y-0.5">
                                          <p className="font-semibold text-foreground flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-blue-500" />
                                            Ở lại trang: <span className="text-blue-600">{durationText}</span>
                                          </p>
                                          <p className="text-xs text-muted-foreground italic">Đường dẫn: {meta.path}</p>
                                        </div>
                                      );
                                    }
                                    if (activity.action === 'PURCHASE') {
                                      return (
                                        <div className="text-sm space-y-0.5">
                                          <p className="font-semibold text-foreground flex items-center gap-2">
                                            <Gift className="w-3 h-3 text-green-500" />
                                            Mua đơn hàng: <span className="text-green-600">#{meta.orderId}</span>
                                          </p>
                                          <p className="text-[11px] text-muted-foreground flex gap-2">
                                            <span>PTTT: <b>{meta.method}</b></span>
                                            {meta.transactionId && <span>Mã GD: <b>{meta.transactionId}</b></span>}
                                          </p>
                                        </div>
                                      );
                                    }
                                    if (activity.action === 'BEGIN_CHECKOUT') {
                                      return (
                                        <div className="text-sm">
                                          <p className="font-semibold text-foreground flex items-center gap-2">
                                            <TrendingUp className="w-3 h-3 text-orange-500" />
                                            Bắt đầu thanh toán: <span className="text-orange-600">{new Intl.NumberFormat('vi-VN').format(meta.cartTotal)}₫</span>
                                          </p>
                                          <p className="text-[11px] text-muted-foreground">Số lượng: {meta.itemCount} sản phẩm</p>
                                        </div>
                                      );
                                    }
                                    return <p className="text-sm font-semibold text-foreground">{activity.metadata}</p>;
                                  } catch (e) {
                                    return <p className="text-sm font-semibold text-foreground">{activity.metadata}</p>;
                                  }
                                })()}
                              </div>
                              <p className="text-xs text-muted-foreground truncate hover:text-primary transition-colors cursor-default">
                                {activity.pageUrl}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center space-y-2">
                            <Activity className="w-12 h-12 text-muted/20 mx-auto" />
                            <p className="text-muted-foreground italic">Chưa có lịch sử hoạt động ghi nhận</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="security" className="m-0 space-y-6">
                        <div className="space-y-4">
                           <Card>
                             <CardHeader className="pb-2">
                               <CardTitle className="text-base flex items-center gap-2">
                                  <ShieldCheck className="w-5 h-5 text-green-500" /> Thông tin bảo mật
                               </CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-4">
                               <div className="flex justify-between items-center py-2 border-b last:border-0">
                                  <span className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="w-4 h-4" /> Email liên kết</span>
                                  <span className="text-sm font-semibold">{analyticsUser?.email}</span>
                               </div>
                               <div className="flex justify-between items-center py-2 border-b last:border-0">
                                  <span className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> IP đăng nhập cuối</span>
                                  <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{analyticsData?.lastIpAddress || 'N/A'}</span>
                               </div>
                               <div className="flex justify-between items-center py-2 border-b last:border-0">
                                  <span className="text-sm text-muted-foreground flex items-center gap-2"><History className="w-4 h-4" /> Lần cuối cập nhật profile</span>
                                  <span className="text-sm font-semibold">{formatDate(analyticsUser?.updatedAt)}</span>
                               </div>
                             </CardContent>
                           </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="notes" className="m-0 space-y-4">
                        <div className="space-y-4">
                          <Card className="border-orange-200 bg-orange-50/30">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-orange-700 text-base">Ghi chú bí mật của Admin</CardTitle>
                              <CardDescription className="text-orange-600/70">Những thông tin này chỉ Admin mới có thể nhìn thấy.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Ví dụ: Khách này hay mua sỉ, cần ưu tiên chăm sóc..."
                                className="min-h-[150px] bg-background border-orange-200 focus-visible:ring-orange-500"
                              />
                              <Button onClick={saveAdminNotes} className="w-full bg-orange-600 hover:bg-orange-700">Lưu ghi chú</Button>
                            </CardContent>
                          </Card>
                        </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default UsersManagement;
