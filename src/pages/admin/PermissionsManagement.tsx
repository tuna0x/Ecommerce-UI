import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Search, 
  Lock, 
  Database, 
  Activity
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import type { IPermission } from "../../types/permission.type";
import { PermissionService } from "../../service/permissionService";
import PaginationControl from "../../components/PaginationControl";
import { cn } from "../../lib/utils";

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET": return "bg-blue-500/10 text-blue-600 border-blue-200";
    case "POST": return "bg-green-500/10 text-green-600 border-green-200";
    case "PUT": return "bg-orange-500/10 text-orange-600 border-orange-200";
    case "PATCH": return "bg-purple-500/10 text-purple-600 border-purple-200";
    case "DELETE": return "bg-red-500/10 text-red-600 border-red-200";
    default: return "bg-slate-500/10 text-slate-600 border-slate-200";
  }
};

const PermissionsManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await PermissionService.getAll(currentPage, 10, searchTerm);
      if (res.data) {
        setPermissions(res.data.result);
        setTotalPages(res.data.meta.pages);
      }
    } catch (error) {
      console.error("Failed to fetch permissions", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [currentPage, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Quyền hạn</h1>
          <p className="text-muted-foreground">
            Danh sách tất cả các tài nguyên API được bảo vệ trong hệ thống.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Danh sách Quyền hạn
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên quyền, module..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-y">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    Tên quyền
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    Module
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    API Path
                  </th>
                  <th className="text-center py-3 px-6 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    Phương thức
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b">
                      <td colSpan={4} className="py-8 px-6">
                        <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : (
                  permissions.map((perm) => (
                    <tr key={perm.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{perm.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-mono italic">
                             ID: #{perm.id}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                          {perm.module}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-muted-foreground">
                        {perm.apiPath}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge className={cn("text-[10px] font-bold px-2 py-0.5 border shadow-none", getMethodColor(perm.method))}>
                          {perm.method}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
                {!isLoading && permissions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-muted-foreground italic">
                      Không tìm thấy quyền hạn nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t bg-muted/5">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/[0.02] border-primary/10">
            <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">RBAC Standard</p>
                        <p className="text-sm font-medium">Phân quyền chuẩn REST</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card className="bg-blue-500/[0.02] border-blue-500/10">
            <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <Database className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Centralized</p>
                        <p className="text-sm font-medium">Quản lý tập trung</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card className="bg-green-500/[0.02] border-green-500/10">
            <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Realtime</p>
                        <p className="text-sm font-medium">Áp dụng tức thì</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PermissionsManagement;
