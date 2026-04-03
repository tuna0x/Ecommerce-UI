import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  ChevronLeft,
  LogOut,
  FolderTree,
  Palette,
  Percent,
  Ticket,
  Image,
  Store,
  FileText,
  MessageCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Chi tiết sản phẩm", url: "/admin/product-detail", icon: FileText },
  { title: "Sản phẩm", url: "/admin/products", icon: Package },
  { title: "Thể loại", url: "/admin/categories", icon: FolderTree },
  { title: "Thuộc tính", url: "/admin/attributes", icon: Palette },
  { title: "Đơn hàng", url: "/admin/orders", icon: ShoppingCart },
  { title: "Người dùng", url: "/admin/users", icon: Users },
  { title: "Khuyến mãi", url: "/admin/promotions", icon: Percent },
  { title: "Mã giảm giá", url: "/admin/coupons", icon: Ticket },
  { title: "Banner Quảng cáo", url: "/admin/banners", icon: Image },
  { title: "Thương hiệu", url: "/admin/brands", icon: Store },
  { title: "Thống kê", url: "/admin/statistics", icon: BarChart3 },
  { title: 'Chat', url: '/admin/chat', icon: MessageCircle },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!collapsed && (
          <span className="text-lg font-bold text-primary">
            Bông Admin
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn("shrink-0", collapsed && "mx-auto")}
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 transition-transform",
              collapsed && "rotate-180",
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/admin"}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              isActive(item.url)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">{item.title}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 px-2">
        <NavLink
          to="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
            "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Thoát Admin</span>
          )}
        </NavLink>
      </div>
    </aside>
  );
};

export default AdminSidebar;
