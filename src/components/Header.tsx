import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDropdown from './NotificationDropdown';
import { User, ShoppingBag, Menu, X, LogOut, Shield, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import SearchDropdown from './SearchDropdown';
import CategoryDropdown from './CategoryDropdown';
import { categoryService } from '../service/categoryService';
import { buildCategoryTree, type CategoryTree } from '../lib/categoryUtils';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

const Header: React.FC = () => {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await categoryService.getAll(0, 100);
      if (res.data) {
        const tree = buildCategoryTree(res.data.result);
        setCategories(tree);
      }
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
      {/* Admin Utility Bar */}
      {user?.role?.name === 'SUPER_ADMIN' && (
        <div className="bg-primary text-primary-foreground py-1.5 md:py-2 text-[11px] md:text-xs font-bold transition-all border-b border-primary/20">
          <div className="container mx-auto flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 uppercase tracking-wider opacity-90">
                <Shield className="w-3 h-3" />
                Admin Mode
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/admin" className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full flex items-center gap-1.5 transition-all active:scale-95 border border-white/10">
                <ShoppingBag className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="container mx-auto">
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
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground transition-colors hover:text-primary">
              BEAUTY<span className="text-primary">LUX</span>
            </h1>
          </Link>

          {/* Search Bar - Desktop */}
          <SearchDropdown className="hidden md:block flex-1 max-w-xl mx-8" />

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center gap-2 p-2 hover:bg-secondary rounded-lg transition-colors">
                    <Avatar className="w-8 h-8 border border-border/50">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
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

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
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
            {isLoading ? (
                <div className="h-10 w-32 bg-secondary/50 rounded animate-pulse flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <CategoryDropdown categories={categories} />
            )}
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
            className="md:hidden border-t border-border overflow-hidden bg-background"
          >
            <div className="p-4 space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                categories.map((category) => {
                  const categorySlug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <div key={category.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <Link
                        to={`/category/${categorySlug}`}
                        className="font-bold text-base mb-2 block hover:text-primary transition-colors text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                      <div className="flex flex-wrap gap-2 ml-2">
                        {category.subcategories.map((sub, index) => (
                          <Link
                            key={index}
                            to={`/category/${categorySlug}?sub=${encodeURIComponent(sub.name)}`}
                            className="text-xs text-muted-foreground hover:text-primary px-3 py-1.5 bg-secondary rounded-full transition-all border border-border/30 hover:border-primary/50"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
