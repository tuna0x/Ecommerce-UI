import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronDown,
  LogOut,
  MousePointer2,
  FolderTree,
  Palette,
  Percent,
  Ticket,
  Tag,
  Image,
  Warehouse,
  X,
  MessageSquare,
  Shield,
  Lock,
  BookOpen,
  type LucideIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Quản lý sản phẩm',
    items: [
      { title: 'Sản phẩm', url: '/admin/products', icon: Package },
      { title: 'Thể loại', url: '/admin/categories', icon: FolderTree },
      { title: 'Thuộc tính', url: '/admin/attributes', icon: Palette },
      { title: 'Thương hiệu', url: '/admin/brands', icon: Tag },
      { title: 'Kho hàng', url: '/admin/inventory', icon: Warehouse },
      { title: 'Chi tiết sản phẩm', url: '/admin/product-detail', icon: BookOpen },
    ],
  },
  {
    label: 'Bán hàng',
    items: [
      { title: 'Đơn hàng', url: '/admin/orders', icon: ShoppingCart },
      { title: 'Khuyến mãi', url: '/admin/promotions', icon: Percent },
      { title: 'Mã giảm giá', url: '/admin/coupons', icon: Ticket },
    ],
  },
  {
    label: 'Nội dung',
    items: [
      { title: 'Banner', url: '/admin/banners', icon: Image },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { title: 'Chat', url: '/admin/chat', icon: MessageSquare },
      { title: 'Người dùng', url: '/admin/users', icon: Users },
      { title: 'Vai trò', url: '/admin/roles', icon: Shield },
      { title: 'Quyền hạn', url: '/admin/permissions', icon: Lock },
      { title: 'Hoạt động', url: '/admin/user-activities', icon: MousePointer2 },
      { title: 'Thống kê', url: '/admin/statistics', icon: BarChart3 },
    ],
  },
];

import { useChat } from '../../context/ChatContext';

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const { totalUnreadCount } = useChat();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuGroups.forEach(g => { initial[g.label] = true; });
    return initial;
  });

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
        {!collapsed && (
          <span className="text-lg font-bold text-primary">Admin</span>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn('shrink-0 hidden lg:flex', collapsed && 'mx-auto')}
          >
            <ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileClose}
          className="shrink-0 lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {menuGroups.map((group) => {
            if (collapsed) {
              return group.items.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.url === '/admin'}
                  title={item.title}
                  className={cn(
                    'flex items-center justify-center px-3 py-2.5 rounded-lg transition-colors relative group',
                    isActive(item.url)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.title === 'Chat' && totalUnreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white"></span>
                    </span>
                  )}
                </NavLink>
              ));
            }

            return (
              <Collapsible
                key={group.label}
                open={openGroups[group.label]}
                onOpenChange={() => toggleGroup(group.label)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  <span>{group.label}</span>
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform', openGroups[group.label] && 'rotate-180')}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end={item.url === '/admin'}
                      onClick={onMobileClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm group relative',
                        isActive(item.url)
                          ? 'bg-primary text-primary-foreground shadow-md scale-[1.02] font-semibold'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.02]'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span className="font-medium">{item.title}</span>
                      {item.title === 'Chat' && totalUnreadCount > 0 && (
                        <div className="ml-auto bg-red-500 text-[10px] font-bold text-white px-1.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center border border-white shadow-sm">
                           {totalUnreadCount}
                        </div>
                      )}
                    </NavLink>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="shrink-0 border-t border-border p-2">
        <NavLink
          to="/"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
            'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Thoát Admin</span>}
        </NavLink>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col',
          'hidden lg:flex',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 bg-card border-r border-border transition-transform duration-300 flex flex-col lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
