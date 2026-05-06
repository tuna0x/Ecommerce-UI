import React, { useEffect, useState, useCallback } from "react";
import { Search, Loader2, Eye, EyeOff, TrendingUp, History, ShieldCheck, Mail, Calendar, MapPin, Activity, Clock, X, UserX, Users, Globe, Timer, ShoppingBag, CreditCard, CheckCircle2, AlertCircle, Fingerprint, FileText, ChartBar, Save, UserPlus, Pencil, Trash2, Camera, Lock, Unlock, Phone } from "lucide-react";
import { cn, compressImage } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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

  // New CRUD states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<IUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: 0,
    gender: "MALE",
    roleId: "",
    phoneNumber: ""
  });

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

  const toggleUserVerification = async (user: IUser) => {
    try {
      await UserService.toggleVerified(user.id, !user.verified);
      toast.success("Đã cập nhật trạng thái xác thực");
      // Update local state for modal if it's open
      if (analyticsUser && analyticsUser.id === user.id) {
        setAnalyticsUser({ ...analyticsUser, verified: !analyticsUser.verified });
      }
      fetchUsers(currentPage);
    } catch (error) {
      console.error("LỖI XÁC THỰC API:", error);
      toast.error("Cập nhật trạng thái xác thực thất bại");
    }
  };

  const handleToggleUserLock = useCallback(async (user: IUser) => {
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

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      age: 0,
      gender: "MALE",
      roleId: roles.find(r => r.name === "ROLE_USER")?.id.toString() || "",
      phoneNumber: ""
    });
    setImageFile(null);
    setImagePreview(null);
    setShowPassword(false);
    setIsUserModalOpen(true);
  };

  const handleOpenEditModal = (user: IUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "", // Don't show password
      age: user.age || 0,
      gender: user.gender || "MALE",
      roleId: user.role?.id.toString() || "",
      phoneNumber: user.phoneNumber || ""
    });
    setImageFile(null);
    setImagePreview(user.image || null);
    setShowPassword(false);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Update
        const updateData = {
          id: editingUser.id,
          name: formData.name,
          age: formData.age,
          gender: formData.gender,
          phoneNumber: formData.phoneNumber,
          role: { id: parseInt(formData.roleId) }
        };
        let fileToUpload = imageFile || undefined;
        if (imageFile) {
          try {
            fileToUpload = await compressImage(imageFile, 800, 800, 0.7);
          } catch (err) {
            console.warn("Failed to compress image on client, using original", err);
          }
        }
        await UserService.updateProfile(updateData, fileToUpload);
        toast.success("Cập nhật người dùng thành công");
      } else {
        // Create
        const createData = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          userProfile: {
            name: formData.name,
            age: formData.age,
            gender: formData.gender
          },
          role: { id: parseInt(formData.roleId) }
        };
        await UserService.create(createData);
        toast.success("Tạo người dùng thành công");
      }
      setIsUserModalOpen(false);
      fetchUsers(currentPage);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await UserService.delete(userToDelete.id);
      if (res.data === "LOCKED") {
        toast.info("Tài khoản đã được KHÓA thay vì xóa vĩnh viễn để bảo vệ tính toàn vẹn của đơn hàng", {
          duration: 5000,
          icon: <Lock className="w-5 h-5 text-amber-500" />
        });
      } else {
        toast.success("Đã xóa vĩnh viễn người dùng thành công");
      }
      setIsDeleteConfirmOpen(false);
      fetchUsers(currentPage);
    } catch (error) {
      console.error(error);
      toast.error("Không thể xử lý yêu cầu xóa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
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
        <Button 
          onClick={handleOpenAddModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95 gap-2 w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          Thêm người dùng
        </Button>
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
        <CardContent className="p-0 sm:p-6">
          <div className={cn("relative", isLoading ? "opacity-50" : "opacity-100")}>
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center -top-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border rounded-xl bg-card">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-4 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">Người dùng</th>
                    <th className="text-left py-4 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">Thông tin</th>
                     <th className="text-left py-4 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">Liên hệ</th>
                    <th className="text-left py-4 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">Vai trò</th>
                    <th className="text-left py-4 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">Trạng thái</th>
                    <th className="text-right py-4 px-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold flex items-center gap-1">
                               {user.name}
                               {user.verified && <ShieldCheck className="w-3.5 h-3.5 text-green-500 fill-green-50" />}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium"><span className="text-muted-foreground">Tuổi:</span> {user.age || 'N/A'}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter tabular-nums">{formatDate(user.createdAt)}</span>
                         </div>
                       </td>
                       <td className="py-4 px-4">
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-primary flex items-center gap-1"><Phone className="w-3 h-3" /> {user.phoneNumber || 'N/A'}</span>
                         </div>
                       </td>
                       <td className="py-4 px-4">
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black tracking-widest h-6">
                           {user.role?.name === "SUPER_ADMIN" ? "Admin" : user.role?.name === "ROLE_USER" ? "Người dùng" : user.role?.name}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                           <div className={cn("w-1.5 h-1.5 rounded-full", user.active ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                           <span className={cn("text-xs font-bold", user.active ? "text-green-600" : "text-red-600")}>
                             {user.active ? "Active" : "Locked"}
                           </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 px-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => viewUserAnalytics(user)} title="Analytics">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-8 w-8", user.active ? "text-amber-500 hover:bg-amber-50" : "text-green-500 hover:bg-green-50")}
                            onClick={() => handleToggleUserLock(user)} 
                            title={user.active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            {user.active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:bg-amber-50" onClick={() => handleOpenEditModal(user)} title="Sửa">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => { setUserToDelete(user); setIsDeleteConfirmOpen(true); }} title="Xóa">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 px-4 pb-4">
               {users.map((user) => (
                 <Card key={user.id} className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-4">
                       <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <Avatar className="w-12 h-12 border-2 border-primary/20">
                                <AvatarImage src={user.image} />
                                <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-lg">{user.name?.charAt(0)}</AvatarFallback>
                             </Avatar>
                             <div>
                                <p className="font-black text-foreground flex items-center gap-1.5">
                                   {user.name}
                                   {user.verified && <ShieldCheck className="w-4 h-4 text-green-500" />}
                                </p>
                                <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                             </div>
                          </div>
                          <Badge className={cn(
                            "text-[10px] font-black uppercase tracking-tighter",
                            user.active ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"
                          )}>
                             {user.active ? "Active" : "Locked"}
                          </Badge>
                       </div>

                       <div className="grid grid-cols-2 gap-3 mb-4 bg-muted/30 rounded-xl p-3">
                          <div className="space-y-0.5">
                             <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Vai trò</p>
                             <p className="text-xs font-black text-primary uppercase">{user.role?.name.replace('ROLE_', '')}</p>
                          </div>
                          <div className="space-y-0.5">
                             <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Tuổi</p>
                             <p className="text-xs font-black text-foreground">{user.age || 'N/A'}</p>
                          </div>
                       </div>

                       <div className="flex items-center justify-between pt-2 border-t border-dashed">
                          <div className="flex items-center gap-1">
                             <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-500" onClick={() => viewUserAnalytics(user)}>
                               <Eye className="h-5 w-5" />
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("h-10 w-10", user.active ? "text-amber-500" : "text-green-500")}
                                onClick={() => handleToggleUserLock(user)}
                             >
                               {user.active ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                             </Button>
                             <Button variant="ghost" size="icon" className="h-10 w-10 text-amber-500" onClick={() => handleOpenEditModal(user)}>
                               <Pencil className="h-5 w-5" />
                             </Button>
                          </div>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500" onClick={() => { setUserToDelete(user); setIsDeleteConfirmOpen(true); }}>
                             <Trash2 className="h-5 w-5" />
                          </Button>
                       </div>
                    </CardContent>
                 </Card>
               ))}
            </div>

            {users.length === 0 && !isLoading && (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                 <div className="p-6 bg-muted/30 rounded-full">
                    <UserX className="w-12 h-12 text-muted-foreground/30" />
                 </div>
                 <div className="space-y-1">
                    <p className="font-black text-xl mb-1">Không tìm thấy người dùng</p>
                    <p className="text-sm text-muted-foreground">Thử thay đổi từ khóa tìm kiếm hoặc vai trò</p>
                 </div>
              </div>
            )}
            
            <div className="p-4 sm:border-t border-none bg-transparent sm:bg-muted/10">
              <PaginationControl
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Role Change Dialog */}
      <AlertDialog
        open={!!pendingRoleChange}
        onOpenChange={(open) => !open && setPendingRoleChange(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Xác nhận thay đổi vai trò</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Bạn có chắc muốn chuyển vai trò của <strong>{pendingRoleChange?.user.name}</strong> sang <span className="text-primary font-bold">{roles.find(r => r.id.toString() === pendingRoleChange?.newRoleId)?.name.replace('ROLE_', '')}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">Đồng ý</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl font-black tracking-tight">Xóa vĩnh viễn tài khoản?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground">
              Hành động này sẽ xóa hoàn toàn dữ liệu của <strong>{userToDelete?.name}</strong> và không thể hoàn tác. Bạn có thực sự chắc chắn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl font-bold w-full sm:w-24">Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold w-full sm:w-32 shadow-lg shadow-red-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xóa ngay"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit User Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl max-h-[92vh] flex flex-col">
          <DialogHeader className="p-8 pb-4 bg-gradient-to-br from-primary/10 via-background to-background shrink-0 border-b border-primary/5">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-primary/20 rounded-2xl">
                  {editingUser ? <Pencil className="w-6 h-6 text-primary" /> : <UserPlus className="w-6 h-6 text-primary" />}
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                    {editingUser ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] mt-0.5 opacity-70">
                    {editingUser ? "Chỉnh sửa thông tin chuyên sâu cho User" : "Thiết lập tài khoản quản trị/người dùng"}
                  </p>
               </div>
             </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-8 py-4 overflow-y-auto">
            <form id="user-form" onSubmit={handleSaveUser} className="space-y-6 pb-6">
               {/* Avatar Upload Container */}
               <div className="flex flex-col items-center justify-center p-6 bg-muted/10 rounded-3xl border-2 border-dashed border-primary/20 group hover:border-primary/40 transition-all">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-background shadow-xl ring-2 ring-primary/20">
                      <AvatarImage src={imagePreview || undefined} />
                      <AvatarFallback className="bg-primary/5 text-primary text-3xl font-black">{formData.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all">
                       <Camera className="w-4 h-4" />
                       <input type="file" className="hidden" accept="image/*" onChange={onImageChange} />
                    </label>
                  </div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-4 tracking-widest group-hover:text-primary transition-colors">Tải lên ảnh đại diện</p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Tên hiển thị</label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Nguyễn Văn A"
                      className="h-12 rounded-xl bg-muted/20 border-2 border-primary/10 focus-visible:ring-primary/30 font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email (Tên đăng nhập)</label>
                    <Input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="example@gmail.com"
                      className="h-12 rounded-xl bg-muted/20 border-2 border-primary/10 focus-visible:ring-primary/30 font-bold"
                      required
                      disabled={!!editingUser}
                    />
                  </div>

                  {!editingUser && (
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Mật khẩu ban đầu</label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder="••••••••"
                          className="h-12 rounded-xl bg-muted/20 border-2 border-primary/10 focus-visible:ring-primary/30 font-bold pr-12"
                          required={!editingUser}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:bg-transparent hover:text-primary transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Độ tuổi</label>
                    <Input 
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                      className="h-12 rounded-xl bg-muted/20 border-2 border-primary/10 focus-visible:ring-primary/30 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Giới tính</label>
                    <Select value={formData.gender} onValueChange={(val) => setFormData({...formData, gender: val})}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-2 border-primary/10 focus-visible:ring-primary/30 font-bold">
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        <SelectItem value="MALE" className="font-bold">Nam giới</SelectItem>
                        <SelectItem value="FEMALE" className="font-bold">Nữ giới</SelectItem>
                        <SelectItem value="OTHER" className="font-bold">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Phân quyền hội viên</label>
                    <Select value={formData.roleId} onValueChange={(val) => setFormData({...formData, roleId: val})}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-2 border-primary/10 focus-visible:ring-primary/30 font-bold">
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        {roles.map(r => (
                          <SelectItem key={r.id} value={r.id.toString()} className="font-bold">
                             {r.name === 'SUPER_ADMIN' ? 'Hệ thống (Admin)' : r.name === 'ROLE_USER' ? 'Khách hàng (User)' : r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
 
                   <div className="space-y-2">
                     <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Số điện thoại</label>
                     <Input 
                       value={formData.phoneNumber}
                       onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, "");
                         if (val.length <= 10) setFormData({...formData, phoneNumber: val});
                       }}
                       placeholder="0912345678"
                       className="h-12 rounded-xl bg-muted/20 border-2 border-primary/10 focus-visible:ring-primary/30 font-bold"
                     />
                   </div>
                </div>
            </form>
          </ScrollArea>

          <div className="p-8 pt-4 bg-muted/10 shrink-0 flex gap-4 border-t border-primary/5">
             <Button 
               variant="outline" 
               className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest hover:bg-background transition-all"
               onClick={() => setIsUserModalOpen(false)}
             >
               Hủy bỏ
             </Button>
             <Button 
               form="user-form"
               type="submit"
               disabled={isSubmitting}
               className="flex-[2] h-12 rounded-xl font-black uppercase tracking-widest bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
             >
               {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
               {editingUser ? "Cập nhật ngay" : "Tạo tài khoản"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Customer 360 View Dialog */}
      <Dialog open={!!analyticsUser} onOpenChange={() => { setAnalyticsUser(null); setAnalyticsData(null); }}>
        <DialogContent className="max-w-4xl h-[780px] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl">
          {/* Enhanced Header with Gradient */}
          <DialogHeader className="p-8 pb-6 shrink-0 bg-gradient-to-br from-primary/15 via-background to-background relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
               <div className="relative group">
                <Avatar className="w-20 h-20 border-4 border-background shadow-xl ring-2 ring-primary/20 transition-transform duration-300 group-hover:scale-105">
                  <AvatarImage src={analyticsUser?.image} />
                  <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                    {analyticsUser?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {analyticsUser?.active && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-background rounded-full shadow-sm" title="Active" />
                )}
               </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <DialogTitle className="text-3xl font-black tracking-tight">{analyticsUser?.name}</DialogTitle>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    {analyticsUser?.verified ? (
                      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200 gap-1 font-bold h-6">
                        <ShieldCheck className="w-3 h-3" /> Đã xác thực
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200 gap-1 font-bold h-6">
                         Xác thực ngay
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2 items-center">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 backdrop-blur-md border text-sm font-medium text-muted-foreground shadow-sm">
                    <Mail className="w-3.5 h-3.5" /> {analyticsUser?.email}
                  </div>
                  {analyticsData?.autoTags?.map(tag => (
                    <Badge key={tag} className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2",
                      tag === 'VIP' ? "bg-amber-500 text-white shadow-amber-500/20" : 
                      tag === 'Nguy cơ' ? "bg-red-500 text-white shadow-red-500/20" : 
                      tag === 'Mới' ? "bg-blue-500 text-white shadow-blue-500/20" : "bg-primary text-white"
                    )}>{tag}</Badge>
                  ))}
                </div>
              </div>

              <div className="text-center sm:text-right pt-2">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-1">Thành viên từ</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/5 border border-primary/10">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <p className="text-sm font-bold text-primary">{formatDate(analyticsUser?.createdAt)}</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          {isAnalyticsLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 animate-spin border-t-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Users className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-bold">Đang tổng hợp dữ liệu 360°</p>
                <p className="text-sm text-muted-foreground max-w-[280px]">Vui lòng chờ trong giây lát khi chúng tôi thống kê hành vi và lịch sử của khách hàng...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs defaultValue="overview" className="h-full flex flex-col">
                <div className="px-8 bg-background border-b z-20">
                  <TabsList className="w-full sm:w-auto h-14 bg-transparent gap-2 p-0 h-auto">
                    <TabsTrigger value="overview" className="h-10 px-6 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all font-bold tracking-tight">
                       Tổng quan
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="h-10 px-6 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all font-bold tracking-tight">
                       Hành vi
                    </TabsTrigger>
                    <TabsTrigger value="security" className="h-10 px-6 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all font-bold tracking-tight">
                       Bảo mật
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="h-10 px-6 data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-600 rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 transition-all font-bold tracking-tight">
                       Ghi chú Admin
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1 overflow-y-auto bg-muted/10">
                  <div className="p-8">
                    <TabsContent value="overview" className="m-0 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="border-none shadow-sm overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <CardContent className="pt-8 pb-6 relative z-10">
                            <div className="flex items-center justify-between mb-6">
                              <div className="p-3 bg-primary/10 rounded-2xl">
                                <TrendingUp className="w-8 h-8 text-primary" />
                              </div>
                              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">LTV</div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Giá trị trọn đời</p>
                              <div className="text-3xl font-black text-primary tracking-tighter">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(analyticsData?.lifetimeValue || 0)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <CardContent className="pt-8 pb-6 relative z-10">
                            <div className="flex items-center justify-between mb-6">
                              <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <ShoppingBag className="w-8 h-8 text-blue-500" />
                              </div>
                              <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest">Orders</div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tần suất mua hàng</p>
                              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                                {analyticsData?.totalOrders || 0} <span className="text-sm font-bold text-muted-foreground ml-1 uppercase">đơn hàng</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm overflow-hidden group md:col-span-2 lg:col-span-1">
                          <CardContent className="pt-8 pb-6 relative z-10">
                            <div className="flex items-center justify-between mb-4">
                               <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Trạng thái đơn hàng</p>
                               <div className="p-2 bg-muted rounded-lg">
                                 <ChartBar className="w-4 h-4 text-muted-foreground" />
                               </div>
                            </div>
                            <div className="h-[120px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={Object.entries(analyticsData?.orderStatusDistribution || {}).map(([name, value]) => ({ name, value }))}
                                    innerRadius={35}
                                    outerRadius={55}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    {Object.entries(analyticsData?.orderStatusDistribution || {}).map((_, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-6">
                         <div className="flex items-center gap-3">
                            <div className="h-px bg-border flex-1" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                               <ShieldCheck className="w-3.5 h-3.5" /> Chi tiết tài khoản
                            </h3>
                            <div className="h-px bg-border flex-1" />
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="p-4 shadow-sm border-none bg-background group hover:ring-1 hover:ring-primary/20 transition-all">
                               <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-2 opacity-60">Xác thực Email</p>
                               <div className="flex items-center justify-between">
                                  {analyticsUser?.verified ? (
                                    <div className="flex items-center gap-1.5 text-green-600">
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span className="text-sm font-black text-xs">Verified</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-red-600 animate-pulse">
                                      <AlertCircle className="w-4 h-4" />
                                      <span className="text-sm font-black text-xs">Unverified</span>
                                    </div>
                                  )}
                                  
                                   <Button 
                                     variant="outline" 
                                     size="sm" 
                                     className="h-7 text-[10px] font-bold px-3 rounded-full hover:bg-primary/10 transition-colors relative z-[100] cursor-pointer pointer-events-auto"
                                     style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                     onClick={() => {
                                        // Handle verification click
                                        if (analyticsUser) toggleUserVerification(analyticsUser);
                                     }}
                                   >
                                     {analyticsUser?.verified ? "Hủy xác thực" : "Xác thực ngay"}
                                   </Button>
                               </div>
                            </Card>

                            <Card className="p-4 shadow-sm border-none bg-background group hover:ring-1 hover:ring-primary/20 transition-all">
                               <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-2 opacity-60">Hoạt động</p>
                               <div className="flex items-center gap-2">
                                 {analyticsUser?.active ? (
                                   <Badge className="bg-green-500 font-bold h-6">Active</Badge>
                                 ) : (
                                   <Badge variant="destructive" className="font-bold h-6">Locked</Badge>
                                 )}
                               </div>
                            </Card>

                             <div className="p-3 rounded-lg border bg-card col-span-2">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Đăng nhập cuối</p>
                                <p className="text-sm font-semibold">{analyticsData?.lastLoginAt ? formatDate(analyticsData.lastLoginAt) : 'Chưa có dữ liệu'}</p>
                             </div>
                          </div>
                       </div>
                    </TabsContent>

                    <TabsContent value="activity" className="m-0">
                      <div className="relative pl-10 space-y-10 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-1 before:bg-gradient-to-b before:from-primary/40 before:via-primary/20 before:to-transparent before:rounded-full">
                        {analyticsData?.recentActivities && analyticsData.recentActivities.length > 0 ? (
                           analyticsData.recentActivities.map((activity, idx) => (
                            <div key={idx} className="relative group animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                              <div className="absolute -left-[38px] top-1 h-5 w-5 rounded-full border-4 border-background bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] z-10 group-hover:scale-125 transition-all duration-300" />
                              
                              <Card className="border-none shadow-sm hover:shadow-md transition-shadow group-hover:bg-background/80">
                                <CardContent className="p-5">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block shadow-sm ring-1 ring-inset",
                                          activity.action.includes('PURCHASE') ? "bg-green-500/10 text-green-600 ring-green-500/20" :
                                          activity.action.includes('VIEW') ? "bg-blue-500/10 text-blue-600 ring-blue-500/20" :
                                          "bg-muted/50 text-muted-foreground ring-border"
                                      )}>
                                        {activity.action.replace('_', ' ')}
                                      </span>
                                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                                         <Clock className="w-3 h-3" />
                                         {new Date(activity.timestamp).toLocaleString('vi-VN')}
                                      </div>
                                    </div>
                                    
                                    <div className="text-[10px] font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded flex items-center gap-1">
                                      <Globe className="w-3 h-3" /> {activity.pageUrl.length > 30 ? activity.pageUrl.substring(0, 30) + '...' : activity.pageUrl}
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    {(() => {
                                      try {
                                        const meta = JSON.parse(activity.metadata);
                                        if (activity.action === 'TIME_ON_PAGE') {
                                          const seconds = Math.floor(meta.durationMs / 1000);
                                          const durationText = seconds >= 60 
                                            ? `${Math.floor(seconds / 60)} phút ${seconds % 60} giây` 
                                            : `${(meta.durationMs / 1000).toFixed(1)} giây`;
                                          return (
                                            <div className="flex items-center gap-4">
                                              <div className="p-3 bg-blue-500/10 rounded-xl">
                                                <Timer className="w-5 h-5 text-blue-600" />
                                              </div>
                                              <div>
                                                <p className="text-sm font-bold text-foreground">Ở lại trang: <span className="text-blue-600 font-black">{durationText}</span></p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5 italic">{meta.path}</p>
                                              </div>
                                            </div>
                                          );
                                        }
                                        if (activity.action === 'PURCHASE') {
                                          return (
                                            <div className="flex items-center gap-4">
                                              <div className="p-3 bg-green-500/10 rounded-xl">
                                                <ShoppingBag className="w-5 h-5 text-green-600" />
                                              </div>
                                              <div>
                                                <p className="text-sm font-bold text-foreground">Giao dịch hoàn tất: <span className="text-green-600 font-black">#{meta.orderId}</span></p>
                                                <div className="flex gap-3 mt-1">
                                                   <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded uppercase">PT: {meta.method}</span>
                                                   {meta.transactionId && <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">Mã: {meta.transactionId}</span>}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        }
                                        if (activity.action === 'BEGIN_CHECKOUT') {
                                          return (
                                              <div className="flex items-center gap-4">
                                                <div className="p-3 bg-amber-500/10 rounded-xl">
                                                  <CreditCard className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div>
                                                  <p className="text-sm font-bold text-foreground">Bắt đầu thanh toán: <span className="text-amber-600 font-black">{new Intl.NumberFormat('vi-VN').format(meta.cartTotal)}₫</span></p>
                                                  <p className="text-[11px] text-muted-foreground mt-0.5 font-bold">{meta.itemCount} sản phẩm trong giỏ hàng</p>
                                                </div>
                                              </div>
                                          );
                                        }
                                        return <p className="text-sm font-bold bg-muted/30 p-3 rounded-lg border-l-4 border-primary/40">{activity.metadata}</p>;
                                      } catch (e) {
                                        return <p className="text-sm font-bold bg-muted/30 p-3 rounded-lg border-l-4 border-primary/40">{activity.metadata}</p>;
                                      }
                                    })()}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          ))
                        ) : (
                          <div className="py-24 text-center space-y-4">
                            <div className="relative mx-auto w-20 h-20">
                               <Activity className="absolute inset-0 w-full h-full text-muted/10 animate-ping duration-[3s]" />
                               <Activity className="relative w-full h-full text-muted/20" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-lg font-bold text-muted-foreground/60">Quét dữ liệu trống</p>
                              <p className="text-xs text-muted-foreground italic">Khách hàng này chưa có tương tác trực tiếp nào được ghi lại</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="security" className="m-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <Card className="border-none shadow-sm overflow-hidden">
                             <div className="bg-primary pt-1" />
                             <CardHeader className="pb-4">
                               <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2 uppercase">
                                  <div className="p-1.5 bg-primary/10 rounded-lg">
                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                  </div> 
                                  Bảo mật tài khoản
                               </CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-1">
                               <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                                  <span className="text-sm text-muted-foreground flex items-center gap-2 font-bold"><Mail className="w-4 h-4 text-primary/60" /> Email hệ thống</span>
                                  <span className="text-sm font-black text-foreground underline decoration-primary/30 decoration-2 underline-offset-4">{analyticsUser?.email}</span>
                               </div>
                               <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                                  <span className="text-sm text-muted-foreground flex items-center gap-2 font-bold"><MapPin className="w-4 h-4 text-primary/60" /> IP cuối</span>
                                  <span className="text-xs font-black font-mono bg-primary/5 text-primary px-3 py-1 rounded-full border border-primary/10 shadow-sm">{analyticsData?.lastIpAddress || 'N/A'}</span>
                               </div>
                               <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                                  <span className="text-sm text-muted-foreground flex items-center gap-2 font-bold"><History className="w-4 h-4 text-primary/60" /> Cập nhật Profile</span>
                                  <span className="text-sm font-black text-foreground">{formatDate(analyticsUser?.updatedAt)}</span>
                               </div>
                             </CardContent>
                           </Card>

                           <Card className="border-none shadow-sm flex flex-col justify-center items-center p-8 bg-gradient-to-br from-background to-muted/30 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-all duration-700" />
                              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative z-10">
                                 <Fingerprint className="w-10 h-10 text-primary animate-pulse" />
                              </div>
                              <div className="text-center relative z-10">
                                 <h4 className="text-lg font-black tracking-tight mb-2">Độ tin cậy tài khoản</h4>
                                 <div className="flex gap-1 justify-center mb-4">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <div key={star} className={cn("w-6 h-1.5 rounded-full", star <= 4 ? "bg-primary" : "bg-muted")} />
                                    ))}
                                 </div>
                                 <p className="text-xs text-muted-foreground px-4 italic leading-relaxed">Dựa trên lịch sử mua hàng, IP ổn định và trạng thái xác thực Email.</p>
                              </div>
                           </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="notes" className="m-0">
                        <Card className="border-none shadow-xl bg-background overflow-hidden">
                          <div className="bg-orange-500 h-1.5 w-full" />
                          <CardHeader className="pb-4">
                             <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <CardTitle className="text-xl font-black tracking-tight text-orange-700 uppercase">Ghi chú chiến lược</CardTitle>
                                  <CardDescription className="text-orange-600/70 font-medium italic">Chỉ quản trị viên cấp cao mới có quyền truy cập vùng dữ liệu này.</CardDescription>
                                </div>
                                <div className="p-3 bg-orange-500/10 rounded-2xl">
                                   <FileText className="w-6 h-6 text-orange-600" />
                                </div>
                             </div>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="relative group">
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Nhập những thông tin quan trọng về thói quen, ưu đãi hoặc cảnh báo dành riêng cho khách hàng này..."
                                className="min-h-[200px] bg-muted/5 border-none focus-visible:ring-1 focus-visible:ring-orange-500/30 text-base font-medium resize-none p-6 leading-relaxed shadow-inner rounded-2xl"
                              />
                              <div className="absolute right-4 bottom-4 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest">Đang soạn thảo...</p>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={saveAdminNotes} 
                              className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                            >
                              <Save className="w-5 h-5 mr-3" /> Xác nhận lưu ghi chú
                            </Button>
                          </CardContent>
                        </Card>
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
