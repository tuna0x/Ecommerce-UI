import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { UserService } from "../service/userService";
import type { IPermission } from "../types/permission.type";

type PermissionMatcher = string | string[];

interface PermissionContextType {
  permissions: IPermission[];
  hasPermission: (module: PermissionMatcher, action?: PermissionMatcher) => boolean;
  hasAdminPermission: (module?: PermissionMatcher, action?: PermissionMatcher) => boolean;
  hasAnyPermission: () => boolean;
  canAccessAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

const normalizeValue = (value?: string) =>
  (value || "").replace(/^ROLE_/i, "").replace(/[^a-z0-9]/gi, "").toUpperCase();

const toArray = (value?: PermissionMatcher) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const getActionAliases = (action: string) => {
  const normalized = normalizeValue(action);
  if (normalized === "READ") return ["READ", "VIEW", "GET", "LIST"];
  if (normalized === "CREATE") return ["CREATE", "ADD", "POST"];
  if (normalized === "UPDATE") return ["UPDATE", "EDIT", "PUT", "PATCH"];
  if (normalized === "DELETE") return ["DELETE", "REMOVE"];
  return [normalized];
};

const isPermissionActive = (permission: IPermission) => permission.active !== false;

const ADMIN_MODULES = [
  "PERMISSIONS",
  "ROLES",
  "USERS",
  "DASHBOARD",
  "PRODUCTS",
  "CATEGORIES",
  "BRANDS",
  "ATTRIBUTES",
  "ATTRIBUTEVALUE",
  "BANNERS",
  "PRODUCTDETAIL",
  "COUPONS",
  "PROMOTIONS",
  "PRODUCTPROMOTIONS",
  "ORDER",
  "TRANSACTIONS",
  "INVENTORY",
  "NOTIFICATIONS",
  "TRACKING",
  "BLOGS",
  "SUBSCRIBERS",
  "FLASHSALE",
  "CONTACT",
  "CHAT",
  "SYSTEM",
  "MONITORING",
];

const ADMIN_API_MARKERS = [
  "/admin",
  "/dashboard",
  "/permissions",
  "/roles",
  "/users",
  "/inventory",
  "/transactions",
  "/tracking",
  "/subscribers",
  "/contact",
  "/notifications/send",
];

const ADMIN_ROUTE_MODULES = [
  "PERMISSIONS",
  "ROLES",
  "USERS",
  "DASHBOARD",
  "PRODUCTS",
  "CATEGORIES",
  "BRANDS",
  "ATTRIBUTES",
  "BANNERS",
  "PRODUCTDETAIL",
  "COUPONS",
  "PROMOTIONS",
  "ORDER",
  "TRANSACTIONS",
  "INVENTORY",
  "TRACKING",
  "BLOGS",
  "FLASHSALE",
  "SYSTEM",
  "MONITORING",
];

const ADMIN_ENTRY_ANY_MODULES = [
  "PERMISSIONS",
  "ROLES",
  "DASHBOARD",
  "PRODUCTS",
  "CATEGORIES",
  "BRANDS",
  "ATTRIBUTES",
  "BANNERS",
  "PRODUCTDETAIL",
  "COUPONS",
  "PROMOTIONS",
  "TRANSACTIONS",
  "INVENTORY",
  "TRACKING",
  "BLOGS",
  "SUBSCRIBERS",
  "FLASHSALE",
  "CONTACT",
  "SYSTEM",
  "MONITORING",
];

const moduleMatches = (permissionModule: string, targetModules: string[]) => {
  const normalizedPermissionModule = normalizeValue(permissionModule);
  return targetModules.some((targetModule) => {
    const normalizedTargetModule = normalizeValue(targetModule);
    return normalizedPermissionModule === normalizedTargetModule ||
      normalizedPermissionModule === `${normalizedTargetModule}S` ||
      `${normalizedPermissionModule}S` === normalizedTargetModule;
  });
};

const isAdminPermission = (permission: IPermission) => {
  const permissionModule = normalizeValue(permission.module);
  const permissionMethod = normalizeValue(permission.method);
  const permissionPath = (permission.apiPath || "").toLowerCase();

  if (!ADMIN_MODULES.includes(permissionModule)) return false;
  if (ADMIN_API_MARKERS.some((marker) => permissionPath.includes(marker))) return true;

  return permissionMethod !== "GET";
};

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [isLoading, setIsLoading] = useState(() => !!user);
  const [loadedUserKey, setLoadedUserKey] = useState<string | null>(null);
  const currentUserKey = user ? String(user.email || user.id) : null;

  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPermissions([]);
      setLoadedUserKey(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Endpoint này cần được hỗ trợ trả về danh sách quyền của user hiện tại
      // Ở backend, ta sẽ dùng UserService.getPermissionsByEmail(email)
      const res = await UserService.getAccountPermissions(); 
      if (res.data) {
        setPermissions(res.data);
      } else {
        setPermissions([]);
      }
      setLoadedUserKey(String(user.email || user.id));
    } catch (error) {
      console.error("Failed to fetch permissions", error);
      setPermissions([]);
      setLoadedUserKey(String(user.email || user.id));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const activePermissions = permissions.filter(isPermissionActive);
  const roleName = normalizeValue(user?.role?.name);
  const isSuperAdmin = roleName === "SUPERADMIN";
  const hasAnyPermission = () => activePermissions.length > 0;
  const permissionLoading = isLoading || (!!currentUserKey && loadedUserKey !== currentUserKey);

  const hasPermission = (module: PermissionMatcher, action?: PermissionMatcher) => {
    if (isSuperAdmin) return true;

    const targetModules = toArray(module).map(normalizeValue);
    const targetActions = toArray(action).flatMap(getActionAliases);

    return activePermissions.some((permission) => {
      const permissionModule = normalizeValue(permission.module);
      const isModuleMatched = moduleMatches(permissionModule, targetModules);

      if (!isModuleMatched) return false;
      if (targetActions.length === 0) return true;

      const permissionName = normalizeValue(permission.name);
      const permissionMethod = normalizeValue(permission.method);

      return targetActions.some((targetAction) =>
        permissionName.includes(targetAction) ||
        permissionMethod.includes(targetAction)
      );
    });
  };

  const hasAdminPermission = (module?: PermissionMatcher, action?: PermissionMatcher) => {
    if (isSuperAdmin) return true;

    const targetModules = toArray(module).map(normalizeValue);
    const targetActions = toArray(action).flatMap(getActionAliases);

    return activePermissions.some((permission) => {
      if (!isAdminPermission(permission)) return false;

      if (targetModules.length > 0 && !moduleMatches(permission.module, targetModules)) {
        return false;
      }

      if (targetActions.length === 0) return true;

      const permissionName = normalizeValue(permission.name);
      const permissionMethod = normalizeValue(permission.method);

      return targetActions.some((targetAction) =>
        permissionName.includes(targetAction) ||
        permissionMethod.includes(targetAction)
      );
    });
  };

  return (
    <PermissionContext.Provider value={{ 
        permissions, 
        hasPermission,
        hasAdminPermission,
        hasAnyPermission,
        canAccessAdmin: isSuperAdmin ||
          hasAdminPermission(ADMIN_ROUTE_MODULES, "READ") ||
          hasAdminPermission(ADMIN_ENTRY_ANY_MODULES),
        isSuperAdmin, 
        isLoading: permissionLoading,
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
