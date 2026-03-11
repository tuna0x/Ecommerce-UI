import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { categories } from "../data/products";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import SearchDropdown from "./SearchDropdown";

function Header() {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | number | null>(
    null,
  );

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      {/* Main Header */}
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              tuna<span className="text-primary">HOUSE</span>
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
                    <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {user?.role?.name === "SUPER_ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className="flex items-center cursor-pointer text-primary font-medium"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Quản trị Admin
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem asChild>
                    <Link
                      to="/account"
                      className="flex items-center cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Tài khoản của tôi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/orders"
                      className="flex items-center cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Đơn hàng
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/wishlist"
                      className="flex items-center cursor-pointer"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Yêu thích
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive"
                  >
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

            {/* Wishlist
            <Link to="/wishlist" className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link> */}

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

      {/* Desktop Navigation / Mega Menu */}
      <nav className="hidden md:block border-t border-border">
        <div className="container mx-auto">
          <ul className="flex items-center gap-0">
            {categories.map((category) => {
              const categorySlug = category.name
                .toLowerCase()
                .replace(/\s+/g, "-");
              return (
                <li
                  key={category.id}
                  className="relative group"
                  onMouseEnter={() => setActiveCategory(category.id)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link
                    to={`/category/${categorySlug}`}
                    className="flex items-center gap-1 px-4 py-3 text-sm font-medium hover:text-primary transition-colors"
                  >
                    {category.name}
                    <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {activeCategory === category.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 min-w-[200px] bg-background border border-border rounded-lg shadow-lg py-2 z-50"
                      >
                        {category.subcategories.map((sub, index) => (
                          <Link
                            key={index}
                            to={`/category/${categorySlug}?sub=${encodeURIComponent(sub)}`}
                            className="block px-4 py-2 text-sm hover:bg-secondary hover:text-primary transition-colors"
                          >
                            {sub}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
            <li>
              <Link
                to="/flash-sale"
                className="flex items-center px-4 py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                🔥 Flash Sale
              </Link>
            </li>
            <li>
              <Link
                to="/brands"
                className="flex items-center px-4 py-3 text-sm font-medium hover:text-primary transition-colors"
              >
                Thương hiệu
              </Link>
            </li>
          </ul>
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
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {categories.map((category) => {
                const categorySlug = category.name
                  .toLowerCase()
                  .replace(/\s+/g, "-");
                return (
                  <div key={category.id}>
                    <Link
                      to={`/category/${categorySlug}`}
                      className="font-medium mb-2 block hover:text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {category.name}
                    </Link>
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories.map((sub, index) => (
                        <Link
                          key={index}
                          to={`/category/${categorySlug}?sub=${encodeURIComponent(sub)}`}
                          className="text-sm text-muted-foreground hover:text-primary px-3 py-1 bg-secondary rounded-full"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
export default Header;
