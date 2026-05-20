import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
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

  // Use a ref to avoid re-creating fetchPermissions on every user object reference change
  const userRef = React.useRef(user);
  userRef.current = user;

  const fetchPermissions = useCallback(async () => {
    const currentUser = userRef.current;
    if (!isAuthenticated || !currentUser) {
      setPermissions([]);
      setLoadedUserKey(null);
      setIsLoading(false);
      return;
    }

    const userKey = String(currentUser.email || currentUser.id);

    // Skip re-fetch if permissions are already loaded for this user
    setLoadedUserKey(prev => {
      if (prev === userKey) return prev; // no state change needed
      return prev;
    });

    setIsLoading(true);
    try {
      const res = await UserService.getAccountPermissions(); 
      if (res.data) {
        setPermissions(res.data);
      } else {
        setPermissions([]);
      }
      setLoadedUserKey(userKey);
    } catch (error) {
      console.error("Failed to fetch permissions", error);
      setPermissions([]);
      setLoadedUserKey(userKey);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Only re-fetch when auth state changes or user identity changes (not object reference)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setPermissions([]);
      setLoadedUserKey(null);
      setIsLoading(false);
      return;
    }

    const userKey = String(user.email || user.id);
    // Only fetch if we haven't loaded for this user yet
    if (loadedUserKey !== userKey) {
      fetchPermissions();
    }
  }, [isAuthenticated, currentUserKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const activePermissions = useMemo(() => permissions.filter(isPermissionActive), [permissions]);
  const roleName = normalizeValue(user?.role?.name);
  const isSuperAdmin = roleName === "SUPERADMIN";
  const hasAnyPermission = useCallback(() => activePermissions.length > 0, [activePermissions]);
  const permissionLoading = isLoading || (!!currentUserKey && loadedUserKey !== currentUserKey);

  const hasPermission = useCallback((module: PermissionMatcher, action?: PermissionMatcher) => {
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
  }, [isSuperAdmin, activePermissions]);

  const hasAdminPermission = useCallback((module?: PermissionMatcher, action?: PermissionMatcher) => {
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
  }, [isSuperAdmin, activePermissions]);

  const canAccessAdmin = useMemo(() => {
    return isSuperAdmin ||
      hasAdminPermission(ADMIN_ROUTE_MODULES, "READ") ||
      hasAdminPermission(ADMIN_ENTRY_ANY_MODULES);
  }, [isSuperAdmin, hasAdminPermission]);

  const contextValue = useMemo(() => ({
    permissions,
    hasPermission,
    hasAdminPermission,
    hasAnyPermission,
    canAccessAdmin,
    isSuperAdmin,
    isLoading: permissionLoading,
    refreshPermissions: fetchPermissions
  }), [
    permissions,
    hasPermission,
    hasAdminPermission,
    hasAnyPermission,
    canAccessAdmin,
    isSuperAdmin,
    permissionLoading,
    fetchPermissions
  ]);

  return (
    <PermissionContext.Provider value={contextValue}>
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
