import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermission } from "../context/PermissionContext";

function AdminRoute() {
  const { user, loading } = useAuth();
  const { canAccessAdmin, isLoading: permissionLoading } = usePermission();

  if (loading || permissionLoading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
