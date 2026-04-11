import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDropdown from './NotificationDropdown';
import { User, ShoppingBag, Menu, X, LogOut, MessageCircle, Sun, Moon, Wallet, ChevronDown, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../hooks/useCategories';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import SearchDropdown from './SearchDropdown';
import CategoryDropdown from './CategoryDropdown';

const Header: React.FC = () => {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { data: categories = [] } = useCategories();

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      {/* Main Header */}
      <div className="container mx-auto px-4 md:px-0">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              BÔNG<span className="text-primary">COSMETIC</span>
            </h1>
          </Link>

          {/* Search Bar - Desktop */}
          <SearchDropdown className="hidden md:block flex-1 max-w-xl mx-8" />

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title={theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            {/* Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center gap-2 p-2 hover:bg-secondary rounded-lg transition-colors">
                    <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="flex items-center cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Tài khoản của tôi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/voucher-wallet" className="flex items-center cursor-pointer">
                      <Wallet className="w-4 h-4 mr-2" />
                      Ví của tôi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="flex items-center cursor-pointer">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Đơn hàng
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-2 p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Tài khoản</span>
              </Link>
            )}

            {/* Notifications */}
            <NotificationDropdown />

            {/* Chat with Admin */}
            <Link to="/chat" className="relative p-2 hover:bg-secondary rounded-lg transition-colors group">
              <MessageCircle className="w-5 h-5 group-hover:text-primary transition-colors" />
            </Link>

            {/* Cart */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                } else {
                  setIsCartOpen(true);
                }
              }}
              className="relative p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <nav className="hidden md:block border-t border-border">
        <div className="container mx-auto">
          <div className="flex items-center gap-1 py-2">
            <CategoryDropdown />
            <Link
              to="/flash-sale"
              className="flex items-center px-4 py-2.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              🔥 Flash Sale
            </Link>
            <Link
              to="/brands"
              className="flex items-center px-4 py-2.5 text-sm font-semibold hover:text-primary transition-colors"
            >
              Thương hiệu
            </Link>
            <Link
              to="/blog"
              className="flex items-center px-4 py-2.5 text-sm font-semibold hover:text-primary transition-colors"
            >
              Blog
            </Link>
            <Link
              to="/about"
              className="flex items-center px-4 py-2.5 text-sm font-semibold hover:text-primary transition-colors"
            >
              Về chúng tôi
            </Link>
            <Link
              to="/contact"
              className="flex items-center px-4 py-2.5 text-sm font-semibold hover:text-primary transition-colors"
            >
              Liên hệ
            </Link>
            <Link
              to="/faq"
              className="flex items-center px-4 py-2.5 text-sm font-semibold hover:text-primary transition-colors"
            >
              FAQ
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <SearchDropdown isMobile />
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar"
          >
            <div className="p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">Danh mục sản phẩm</p>
              {categories.map((category) => (
                <MobileCategoryAccordion
                  key={category.id}
                  category={category}
                  onClose={() => setIsMenuOpen(false)}
                />
              ))}
            </div>


            {/* Separator + Additional Links */}
            <div className="border-t border-border pt-4 pb-4 px-4 space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">Khám phá</p>
              {[
                { to: "/flash-sale", label: "🔥 Flash Sale" },
                { to: "/orders", label: "📦 Đơn hàng của tôi" },
                { to: "/blog", label: "Blog làm đẹp" },
                { to: "/about", label: "Về chúng tôi" },
                { to: "/contact", label: "Liên hệ" },
                { to: "/faq", label: "FAQ - Hỏi đáp" },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="block px-1 py-2 text-sm font-semibold hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

interface MobileCategoryAccordionProps {
  category: any;
  onClose: () => void;
}

const MobileCategoryAccordion: React.FC<MobileCategoryAccordionProps> = ({ category, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const categorySlug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="border-b border-border/50 last:border-0">
      <div className="flex items-center justify-between py-3">
        <Link
          to={`/category/${categorySlug}`}
          className="font-semibold text-foreground hover:text-primary transition-colors flex-1"
          onClick={onClose}
        >
          {category.name}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-secondary rounded-md transition-colors"
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-secondary/30 rounded-lg mb-2"
          >
            <div className="p-3 space-y-3">
              {category.children.map((sub: any, index: number) => (
                <div key={index} className="space-y-2">
                  <Link
                    to={`/category/${categorySlug}?sub=${encodeURIComponent(sub.name)}`}
                    className="text-sm font-bold text-foreground hover:text-primary block"
                    onClick={onClose}
                  >
                    {sub.name}
                  </Link>
                  {sub.children && sub.children.length > 0 && (
                    <div className="flex flex-wrap gap-2 ml-1">
                      {sub.children.map((child: any, cIndex: number) => (
                        <Link
                          key={cIndex}
                          to={`/category/${categorySlug}?sub=${encodeURIComponent(sub.name)}&sub2=${encodeURIComponent(child.name)}`}
                          className="text-[11px] font-medium text-muted-foreground hover:text-primary px-2 py-1 bg-background border border-border rounded-full hover:border-primary transition-all"
                          onClick={onClose}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;
