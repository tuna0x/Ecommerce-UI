import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute() {
  const { user } = useAuth();

  if (!user) return null;

  if (user?.role.name !== "SUPER_ADMIN") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export default AdminRoute;
