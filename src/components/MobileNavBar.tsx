import React from "react";
import { motion } from "framer-motion";
import { Home, Grid3X3, Bell, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const MobileNavBar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { icon: Home, label: "Trang chủ", path: "/" },
    { icon: Grid3X3, label: "Danh mục", path: "/categories" },
    { icon: Bell, label: "Thông báo", path: "/notifications" },
    { icon: User, label: "Tài khoản", path: "/account" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 pb-safe">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 py-2 px-4"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-1 rounded-lg ${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                <item.icon className="w-5 h-5" />
              </motion.div>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
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
