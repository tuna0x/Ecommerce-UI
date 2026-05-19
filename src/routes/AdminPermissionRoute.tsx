import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermission } from "../context/PermissionContext";

interface AdminPermissionRouteProps {
  module?: string | string[];
  action?: string | string[];
  children: ReactNode;
}

function AdminPermissionRoute({ module, action, children }: AdminPermissionRouteProps) {
  const { canAccessAdmin, hasAdminPermission, isLoading } = usePermission();

  if (isLoading) return null;

  if (!canAccessAdmin) {
    return <Navigate to="/" replace />;
  }

  if (module && !hasAdminPermission(module, action)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

export default AdminPermissionRoute;
