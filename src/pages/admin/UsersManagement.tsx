import React, { useState } from "react";
import { Search, Shield, ShieldOff, UserCog } from "lucide-react";
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
import { mockUsers } from "../../data/mockUsers";
import type { AdminUser } from "../../data/mockUsers";
import { toast } from "sonner";

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [userToToggleRole, setUserToToggleRole] = useState<AdminUser | null>(
    null,
  );

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const toggleUserRole = (user: AdminUser) => {
    setUserToToggleRole(user);
  };

  const confirmToggleRole = () => {
    if (!userToToggleRole) return;

    const newRole = userToToggleRole.role === "admin" ? "user" : "admin";
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userToToggleRole.id ? { ...u, role: newRole } : u,
      ),
    );
    toast.success(
      `Đã ${newRole === "admin" ? "cấp" : "thu hồi"} quyền admin cho ${userToToggleRole.name}`,
    );
    setUserToToggleRole(null);
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u,
      ),
    );
    toast.success("Đã cập nhật trạng thái người dùng");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Quản lý người dùng
        </h1>
        <p className="text-muted-foreground">
          Xem danh sách và phân quyền người dùng
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground">Tổng người dùng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "admin").length}
            </div>
            <p className="text-sm text-muted-foreground">Admin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {users.filter((u) => u.status === "active").length}
            </div>
            <p className="text-sm text-muted-foreground">Đang hoạt động</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">Người dùng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Người dùng
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    SĐT
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Vai trò
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Trạng thái
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Đơn hàng
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Chi tiêu
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Ngày tạo
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm">{user.phone}</td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={
                          user.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {user.role === "admin" ? "Admin" : "Người dùng"}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        variant="outline"
                        className={
                          user.status === "active"
                            ? "border-green-500 text-green-600"
                            : "border-gray-400 text-gray-500"
                        }
                      >
                        {user.status === "active" ? "Hoạt động" : "Ngừng"}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-sm">{user.totalOrders}</td>
                    <td className="py-3 px-2 text-sm">
                      {formatCurrency(user.totalSpent)}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={
                            user.role === "admin"
                              ? "Thu hồi quyền admin"
                              : "Cấp quyền admin"
                          }
                          onClick={() => toggleUserRole(user)}
                        >
                          {user.role === "admin" ? (
                            <ShieldOff className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Shield className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={
                            user.status === "active"
                              ? "Vô hiệu hóa"
                              : "Kích hoạt"
                          }
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              {userToToggleRole?.role === "admin"
                ? "Thu hồi quyền admin?"
                : "Cấp quyền admin?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggleRole?.role === "admin"
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
