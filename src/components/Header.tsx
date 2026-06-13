import React, { Suspense, lazy, useState } from 'react';
import { User, ShoppingBag, Menu, X, LogOut, MessageCircle, Sun, Moon, Wallet, ChevronDown, Flame, BookOpen, Info, Phone, HelpCircle, Package, Heart, CalendarCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../context/PermissionContext';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../hooks/useCategories';
import type { FrontendCategory } from '../hooks/useCategories';
import { Link, useNavigate } from 'react-router-dom';
import { NavLink } from './NavLink';
import { useWishlist } from '../hooks/useWishlist';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import SearchDropdown from './SearchDropdown';
import { getCategoryIcon } from '../lib/icons';

const CategoryDropdown = lazy(() => import('./CategoryDropdown'));
const NotificationDropdown = lazy(() => import('./NotificationDropdown'));
const SkincareCheckIn = lazy(() => import('./SkincareCheckIn'));

const Header: React.FC = () => {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const { canAccessAdmin } = usePermission();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSkincareOpen, setIsSkincareOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { data: categories = [] } = useCategories();
  const { wishlistCount } = useWishlist();

  return (
    <header className="relative z-40 bg-background border-b border-border">
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
          <Link 
            to="/" 
            className="flex-shrink-0"
            onClick={() => setIsMenuOpen(false)}
          >
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
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium max-w-[180px] truncate">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                   <DropdownMenuSeparator />
                  {canAccessAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center cursor-pointer text-primary font-medium">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Quản trị Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
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
                    <Link to="/wishlist" className="flex items-center justify-between cursor-pointer w-full">
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-2" />
                        Danh sách yêu thích
                      </div>
                      {wishlistCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {wishlistCount > 99 ? '99+' : wishlistCount}
                        </span>
                      )}
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

            {/* Daily Skincare Check-in */}
            <button
              onClick={() => setIsSkincareOpen(true)}
              className="relative p-2 hover:bg-secondary rounded-lg transition-colors group"
              title="Điểm danh Skincare hằng ngày 🌸"
            >
              <CalendarCheck className="w-5 h-5 group-hover:text-primary transition-colors text-pink-500 animate-pulse" />
            </button>

            {/* Notifications */}
            {isAuthenticated ? (
              <Suspense fallback={null}>
                <NotificationDropdown />
              </Suspense>
            ) : null}

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
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-fade-in-scale">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <nav className="hidden md:block border-t border-border">
        <div className="container mx-auto">
          <div className="flex items-center gap-1 py-2">
            <Suspense fallback={<div className="h-[46px] w-[228px] rounded-lg bg-primary/5" aria-hidden="true" />}>
              <CategoryDropdown />
            </Suspense>
            <NavLink
              to="/category/all"
              className="flex items-center px-4 py-2.5 text-sm font-semibold hover:text-primary transition-colors"
              activeClassName="text-primary bg-primary/10 rounded-lg"
            >
              Cửa hàng
            </NavLink>
            <NavLink
              to="/flash-sale"
              className="flex items-center px-4 py-2.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              activeClassName="bg-primary/10 rounded-lg"
            >
              🔥 Flash Sale
            </NavLink>
            <NavLink
              to="/brands"
              className="flex items-center px-4 py-2.5 text-sm font-semibold hover:text-primary transition-colors"
              activeClassName="text-primary bg-primary/10 rounded-lg"
            >
              Thương hiệu
            </NavLink>
            <NavLink
              to="/blog"
              className="flex items-center px-4 py-2.5 text-sm font-semibold hover:text-primary transition-colors"
              activeClassName="text-primary bg-primary/10 rounded-lg"
            >
              Blog
            </NavLink>
            <NavLink
              to="/about"
              className="flex items-center px-4 py-2.5 text-sm font-semibold hover:text-primary transition-colors"
              activeClassName="text-primary bg-primary/10 rounded-lg"
            >
              Về chúng tôi
            </NavLink>
            <NavLink
              to="/contact"
              className="flex items-center px-4 py-2.5 text-sm font-semibold hover:text-primary transition-colors"
              activeClassName="text-primary bg-primary/10 rounded-lg"
            >
              Liên hệ
            </NavLink>
            <NavLink
              to="/faq"
              className="flex items-center px-4 py-2.5 text-sm font-semibold hover:text-primary transition-colors"
              activeClassName="text-primary bg-primary/10 rounded-lg"
            >
              FAQ
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <SearchDropdown isMobile />
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden border-t border-border overflow-y-auto custom-scrollbar bg-background/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-out ${
          isMenuOpen ? 'max-h-[85vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
            <div className="p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-2 mb-3">Danh mục sản phẩm</p>
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
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-2 mb-3">Khám phá</p>
              {[
                { to: "/category/all", label: "Tất cả sản phẩm", icon: ShoppingBag, color: "text-primary" },
                { 
                  to: "/wishlist", 
                  label: "Yêu thích", 
                  icon: Heart, 
                  color: "text-rose-500",
                  badge: wishlistCount > 0 ? wishlistCount : null 
                },
                { to: "/flash-sale", label: "Flash Sale", icon: Flame, color: "text-orange-500" },
                { to: "/orders", label: "Đơn hàng của tôi", icon: Package, color: "text-blue-500" },
                { to: "/blog", label: "Blog làm đẹp", icon: BookOpen, color: "text-emerald-500" },
                { to: "/about", label: "Về chúng tôi", icon: Info, color: "text-primary" },
                { to: "/contact", label: "Liên hệ", icon: Phone, color: "text-teal-500" },
                { to: "/faq", label: "FAQ - Hỏi đáp", icon: HelpCircle, color: "text-indigo-500" },
              ].map(({ to, label, icon: Icon, color, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  className="flex items-center justify-between px-2 py-3 text-sm font-semibold hover:bg-primary/5 rounded-xl transition-all"
                  activeClassName="bg-primary/10 text-primary border-r-4 border-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{label}</span>
                  </div>
                  {badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
                      {typeof badge === 'number' && badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
      </div>

      {/* Skincare Check-in Right Drawer */}
      <Suspense fallback={null}>
        <SkincareCheckIn isOpen={isSkincareOpen} onClose={() => setIsSkincareOpen(false)} />
      </Suspense>
    </header>
  );
};

interface MobileCategoryAccordionProps {
  category: FrontendCategory;
  onClose: () => void;
}

const CategoryIcon = ({ name }: { name: string }) => {
  return React.createElement(getCategoryIcon(name), { className: "w-4 h-4" });
};

const MobileCategoryAccordion: React.FC<MobileCategoryAccordionProps> = ({ category, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const categorySlug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
  const hasChildren = category.children && category.children.length > 0;
  
  return (
    <div className="group">
      <div className="flex items-center justify-between py-1 px-1">
        <Link
          to={`/category/${categorySlug}`}
          className="flex items-center gap-3 font-semibold text-foreground hover:text-primary transition-all flex-1 py-2"
          onClick={onClose}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <CategoryIcon name={category.name} />
          </div>
          <span>{category.name}</span>
        </Link>
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-secondary rounded-md transition-colors"
          >
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <div
        className={`overflow-hidden bg-secondary/30 rounded-lg mb-2 transition-all duration-200 ${
          isOpen && hasChildren ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
            <div className="p-3 space-y-3">
              {category.children.map((sub, index: number) => (
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
                      {sub.children.map((child, cIndex: number) => (
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
      </div>
    </div>
  );
};

export default Header;
