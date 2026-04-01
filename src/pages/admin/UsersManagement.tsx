import React, { useEffect, useState, useCallback } from "react";
import { Search, Shield, ShieldOff, UserCog, Loader2 } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { toast } from "sonner";
import { UserService } from "../../service/userService";
import { RoleService } from "../../service/roleService";
import type { IUser } from "../../types/user.type";
import type { IRole } from "../../types/role.type";
import PaginationControl from "../../components/PaginationControl";

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [userToToggleRole, setUserToToggleRole] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const fetchUsers = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      // Build filter
      let filter = searchTerm ? `(name~'${searchTerm}' or email~'${searchTerm}')` : "";
      if (roleFilter !== "all") {
        filter = filter ? `${filter} and role.name:'${roleFilter}'` : `role.name:'${roleFilter}'`;
      }

      const res = await UserService.getAll(page, pageSize, filter || undefined);
      if (res.data) {
        setUsers(res.data.result);
        setTotalPages(res.data.meta.pages);
        setTotalElements(res.data.meta.total);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, roleFilter, pageSize]);

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

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const toggleUserRole = useCallback((user: IUser) => {
    setUserToToggleRole(user);
  }, []);

  const confirmToggleRole = useCallback(async () => {
    if (!userToToggleRole) return;

    try {
      const adminRole = roles.find((r) => r.name === "SUPER_ADMIN");
      const userRole = roles.find((r) => r.name === "ROLE_USER");

      if (!adminRole || !userRole) {
        toast.error("Không tìm thấy thông tin vai trò trên hệ thống");
        return;
      }

      const isCurrentlyAdmin = userToToggleRole.role?.name === "SUPER_ADMIN";
      const newRole = isCurrentlyAdmin ? userRole : adminRole;
      
      await UserService.updateRole(userToToggleRole.id, newRole.id);
      toast.success(
        `Đã ${newRole.name === "SUPER_ADMIN" ? "cấp" : "thu hồi"} quyền admin cho ${userToToggleRole.name}`,
      );
      fetchUsers(currentPage);
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật quyền thất bại");
    } finally {
      setUserToToggleRole(null);
    }
  }, [userToToggleRole, roles, fetchUsers, currentPage]);

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
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>Tìm kiếm</Button>
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
          <div className={cn("relative transition-opacity duration-300", isLoading ? "opacity-50" : "opacity-100")}>
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
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm">
                          <p className="font-medium">{user.age} tuổi</p>
                          <p className="text-xs text-muted-foreground">{user.address}</p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            user.role?.name === "SUPER_ADMIN" ? "default" : "secondary"
                          }
                          className={cn("text-[10px] uppercase font-bold tracking-wider", user.role?.name === "SUPER_ADMIN" ? "bg-primary" : "")}
                        >
                          {user.role?.name === "SUPER_ADMIN" ? "Admin" : "Người dùng"}
                        </Badge>
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
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            title={
                              user.role?.name === "SUPER_ADMIN"
                                ? "Thu hồi quyền admin"
                                : "Cấp quyền admin"
                            }
                            onClick={() => toggleUserRole(user)}
                          >
                            {user.role?.name === "SUPER_ADMIN" ? (
                              <ShieldOff className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Shield className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !isLoading && (
                      <tr>
                          <td colSpan={6} className="text-center py-20 text-muted-foreground italic">
                              Không tìm thấy người dùng nào phù hợp
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

      {/* Confirm Role Toggle Dialog */}
      <AlertDialog
        open={!!userToToggleRole}
        onOpenChange={() => setUserToToggleRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggleRole?.role?.name === "SUPER_ADMIN"
                ? "Thu hồi quyền admin?"
                : "Cấp quyền admin?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggleRole?.role?.name === "SUPER_ADMIN"
                ? `Bạn có chắc muốn thu hồi quyền admin của ${userToToggleRole?.name}? Họ sẽ không còn truy cập được trang quản trị.`
                : `Bạn có chắc muốn cấp quyền admin cho ${userToToggleRole?.name}? Họ sẽ có thể truy cập và quản lý toàn bộ hệ thống.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleRole}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersManagement;
