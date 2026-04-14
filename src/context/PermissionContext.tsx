import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { UserService } from "../service/userService";

interface IPermission {
  name: string;
  apiPath: string;
  method: string;
  module: string;
}

interface PermissionContextType {
  permissions: IPermission[];
  hasPermission: (module: string, action: string) => boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPermissions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Endpoint này cần được hỗ trợ trả về danh sách quyền của user hiện tại
      // Ở backend, ta sẽ dùng UserService.getPermissionsByEmail(email)
      const res = await UserService.getAccountPermissions(); 
      if (res.data) {
        setPermissions(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch permissions", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const isSuperAdmin = user?.role?.name === "SUPER_ADMIN";

  const hasPermission = (module: string, action: string) => {
    if (isSuperAdmin) return true;
    
    return permissions.some(p => 
      p.module.toLowerCase() === module.toLowerCase() && 
      p.name.toUpperCase().includes(action.toUpperCase())
    );
  };

  return (
    <PermissionContext.Provider value={{ 
        permissions, 
        hasPermission, 
        isSuperAdmin, 
        isLoading,
        refreshPermissions: fetchPermissions
    }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermission must be used within a PermissionProvider");
  }
  return context;
};
