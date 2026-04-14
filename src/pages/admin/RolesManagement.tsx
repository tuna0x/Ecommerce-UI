import React, { useState, useEffect, useMemo } from "react";
import { 
  Users,
  Plus, 
  ShieldCheck, 
  Edit2, 
  Trash2
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/Checkbox";

import type { IRole } from "../../types/role.type";
import type { IPermission } from "../../types/permission.type";
import { RoleService } from "../../service/roleService";
import { PermissionService } from "../../service/permissionService";
import { cn } from "../../lib/utils";
import { useToast } from "../../hooks/use-toast";

const RolesManagement: React.FC = () => {
  const [roles, setRoles] = useState<IRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<IPermission[]>([]);
  const [searchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<IRole>>({
    name: "",
    description: "",
    active: true,
    permissions: []
  });

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [roleRes, permRes] = await Promise.all([
        RoleService.getAll(),
        PermissionService.getAll(1, 1000) // Lấy toàn bộ quyền cho matrix
      ]);
      
      if (roleRes.data) setRoles(roleRes.data.result);
      if (permRes.data) setAllPermissions(permRes.data.result);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Group permissions by common module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, IPermission[]> = {};
    allPermissions.forEach((p) => {
      if (!groups[p.module]) groups[p.module] = [];
      groups[p.module].push(p);
    });
    return groups;
  }, [allPermissions]);

  const handleOpenModal = (role?: IRole) => {
    if (role) {
      setIsEditing(true);
      setCurrentRole(role);
    } else {
      setIsEditing(false);
      setCurrentRole({ name: "", description: "", active: true, permissions: [] });
    }
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permissionId: number) => {
    setCurrentRole((prev) => {
      const perms = prev.permissions || [];
      const isExist = perms.some((p) => p.id === permissionId);
      
      if (isExist) {
        return { ...prev, permissions: perms.filter((p) => p.id !== permissionId) };
      } else {
        const fullPerm = allPermissions.find((p) => p.id === permissionId);
        return { ...prev, permissions: [...perms, fullPerm!] };
      }
    });
  };

  const handleToggleModule = (module: string, checked: boolean) => {
      const modulePerms = groupedPermissions[module];
      const otherPerms = (currentRole.permissions || []).filter(p => p.module !== module);
      
      if (checked) {
          setCurrentRole(prev => ({
              ...prev,
              permissions: [...otherPerms, ...modulePerms]
          }));
      } else {
          setCurrentRole(prev => ({
              ...prev,
              permissions: otherPerms
          }));
      }
  };

  const handleSave = async () => {
    if (!currentRole.name) {
      toast({ title: "Lỗi", description: "Tên vai trò không được để trống", variant: "destructive" });
      return;
    }

    try {
      if (isEditing) {
        await RoleService.update(currentRole);
        toast({ title: "Thành công", description: `Đã cập nhật vai trò ${currentRole.name}` });
      } else {
        await RoleService.create(currentRole);
        toast({ title: "Thành công", description: `Đã tạo vai trò mới ${currentRole.name}` });
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (error: any) {
      toast({ 
        title: "Lỗi", 
        description: error.response?.data?.message || "Không thể lưu vai trò", 
        variant: "destructive" 
      });
    }
  };

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Vai trò</h1>
          <p className="text-muted-foreground">
            Định nghĩa các nhóm quyền và gán cho người dùng trong hệ thống.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Tạo Vai trò
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <CardHeader className="h-24 bg-muted/50" />
                    <CardContent className="space-y-2 pt-4">
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                </Card>
            ))
        ) : (
          filteredRoles.map((role) => (
            <Card key={role.id} className="group hover:shadow-md transition-all duration-300 border-border/50 relative overflow-hidden">
              <div className={cn(
                  "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform group-hover:scale-110",
                  role.name === "SUPER_ADMIN" ? "bg-primary" : "bg-blue-500"
              )} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <Badge variant={role.active ? "secondary" : "destructive"} className="text-[10px] uppercase font-bold tracking-wider">
                    {role.active ? "Hoạt động" : "Bị khóa"}
                  </Badge>
                </div>
                <CardTitle className="mt-4 text-xl">{role.name}</CardTitle>
                <CardDescription className="line-clamp-2 h-10 italic">
                  {role.description || "Không có mô tả cho vai trò này."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Users className="h-4 w-4" />
                   <span>{role.permissions?.length || 0} quyền được gán</span>
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                   <Button variant="outline" size="sm" onClick={() => handleOpenModal(role)} className="h-8 gap-1.5 border-primary/20 hover:bg-primary/5">
                      <Edit2 className="h-3.5 w-3.5" /> Sửa
                   </Button>
                   {role.name !== "SUPER_ADMIN" && (
                       <Button variant="ghost" size="sm" className="h-8 text-destructive hover:bg-destructive/5 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> Xóa
                       </Button>
                   )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Role Editor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{isEditing ? "Chỉnh sửa Vai trò" : "Thêm Vai trò mới"}</DialogTitle>
            <DialogDescription>
              Thiết lập tên, mô tả và ma trận quyền hạn cho vai trò này.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="role-name">Tên vai trò <span className="text-red-500">*</span></Label>
                <Input
                  id="role-name"
                  placeholder="Vd: NHÂN_VIÊN_KHO"
                  value={currentRole.name}
                  onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value.toUpperCase() })}
                  disabled={isEditing && currentRole.name === "SUPER_ADMIN"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-desc">Mô tả</Label>
                <Input
                  id="role-desc"
                  placeholder="Mô tả chức năng của vai trò..."
                  value={currentRole.description}
                  onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold flex items-center gap-2">
                   <ShieldCheck className="h-5 w-5 text-primary" />
                   Ma trận Quyền hạn
                </Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Đã chọn {currentRole.permissions?.length || 0} / {allPermissions.length} quyền
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {Object.entries(groupedPermissions).map(([module, perms]) => {
                  const selectedCount = perms.filter(p => currentRole.permissions?.some(cp => cp.id === p.id)).length;
                  const isAllSelected = selectedCount === perms.length;

                  return (
                    <div key={module} className="border rounded-xl overflow-hidden bg-card">
                      <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                            {module}
                          </Badge>
                          <span className="text-xs text-muted-foreground">({selectedCount}/{perms.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Label htmlFor={`select-all-${module}`} className="text-[10px] cursor-pointer font-bold uppercase text-muted-foreground">Chọn tất cả</Label>
                           <Checkbox 
                                id={`select-all-${module}`} 
                                checked={isAllSelected}
                                onCheckedChange={(checked) => handleToggleModule(module, !!checked)}
                                className="h-3.5 w-3.5 border-primary/20"
                           />
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {perms.map((p) => {
                           const isChecked = currentRole.permissions?.some(cp => cp.id === p.id);
                           return (
                            <div 
                              key={p.id} 
                              className={cn(
                                "flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer group",
                                isChecked ? "bg-primary/[0.03] border-primary/20" : "hover:bg-muted/50 border-transparent"
                              )}
                              onClick={() => handleTogglePermission(p.id)}
                            >
                              <Checkbox 
                                checked={isChecked}
                                onCheckedChange={() => handleTogglePermission(p.id)}
                                className="mt-0.5 pointer-events-none"
                              />
                              <div className="space-y-1">
                                <p className="text-xs font-semibold leading-none group-hover:text-primary transition-colors">{p.name}</p>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 leading-none uppercase border-muted-foreground/30 text-muted-foreground font-mono">
                                    {p.method}
                                  </Badge>
                                  <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[120px]">
                                    {p.apiPath}
                                  </span>
                                </div>
                              </div>
                            </div>
                           )
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/20 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={isEditing && currentRole.name === "SUPER_ADMIN"}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesManagement;
