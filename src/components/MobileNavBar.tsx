import React from 'react';
import { motion } from 'framer-motion';
import { Home, Grid3X3, MessageCircle, Bell, User, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MobileNavBar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: Grid3X3, label: 'Danh mục', path: '/categories' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: ShoppingBag, label: 'Đơn hàng', path: '/orders' },
    { icon: User, label: 'Tài khoản', path: '/account' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 pb-safe">
      <div className="flex items-center justify-around py-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className="flex-1 flex flex-col items-center gap-1 py-1 pr-0"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-1 rounded-lg ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <item.icon className="w-5 h-5" />
              </motion.div>
              <span
                className={`text-[9px] font-medium text-center truncate w-full px-0.5 ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavBar;
