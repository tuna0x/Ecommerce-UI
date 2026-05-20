import React, { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const AdminLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-card border-b border-border lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-lg font-bold text-primary">Admin</span>
      </div>

      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          'lg:ml-64',
          sidebarCollapsed && 'lg:ml-16'
        )}
      >
        <div className="p-4 md:p-6">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent opacity-50 mb-4"></div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
