import React from "react";
import { usePermission } from "../../context/PermissionContext";

interface AccessControlProps {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component giúp ẩn/hiện nội dung dựa trên quyền của user.
 * 
 * @example
 * <AccessControl module="USERS" action="DELETE">
 *   <button>Xóa User</button>
 * </AccessControl>
 */
export const AccessControl: React.FC<AccessControlProps> = ({ 
  module, 
  action, 
  children, 
  fallback = null 
}) => {
  const { hasPermission, isLoading } = usePermission();

  if (isLoading) return null;

  if (hasPermission(module, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
