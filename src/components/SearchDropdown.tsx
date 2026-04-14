import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProductService } from "../service/productService";
import type { IProduct } from "../types/product.type";
import { logActivity } from "../service/trackingService";

interface SearchDropdownProps {
  className?: string;
  isMobile?: boolean;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  className = "",
  isMobile = false,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { } = useAuth(); // No longer need isAuthenticated here

  // Filter products based on query from API
  useEffect(() => {
    if (!query.trim()) {
      setFilteredProducts([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setIsLoading(true);
        setIsOpen(true);
        const res = await ProductService.getAll(0, 6, query);
        if (res.data?.result) {
          setFilteredProducts(res.data.result);
        } else {
          setFilteredProducts([]);
        }
      } catch (error) {
        console.error("Search failed:", error);
        setFilteredProducts([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Debounce to 500ms as requested to minimize API calls

    return () => clearTimeout(handler);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      logActivity('SEARCH', { keyword: query.trim() });
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleProductClick = (productId: number) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/product/${productId}`);
  };

  const handleViewAll = () => {
    if (query.trim()) {
      setIsOpen(false);
      logActivity('SEARCH', { keyword: query.trim() });
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search
            className={`absolute ${isMobile ? "left-3" : "left-4"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              isMobile
                ? "Tìm kiếm sản phẩm..."
                : "Tìm kiếm sản phẩm, thương hiệu..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) {
                setIsOpen(true);
              }
            }}
            className={`w-full ${isMobile ? "pl-10 pr-10" : "pl-11 pr-10"} py-2.5 bg-secondary rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all`}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50 ${isMobile ? "mx-0" : ""}`}
          >
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Đang tìm kiếm...
                </p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Sản phẩm ({filteredProducts.length})
                  </p>

                  <div className="space-y-1">
                    {filteredProducts.map((product) => {
                      const displayPrice = product.finalPrice || product.price || 0;
                      const displayOriginalPrice = product.originalPrice || 0;

                      return (
                        <button
                          key={product.id}
                          onClick={() => handleProductClick(product.id)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-secondary rounded-lg transition-colors text-left"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                            <img
                              src={product.thumbnail || (Array.isArray(product.image) && product.image.length > 0 ? product.image[0] : (typeof product.image === 'string' ? product.image : ''))}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {typeof product.brand === 'string' ? product.brand : (product.brand?.name || 'No Brand')}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-primary">
                              {formatPrice(displayPrice)}
                            </p>
                            {displayOriginalPrice > displayPrice && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatPrice(displayOriginalPrice)}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* View All Button */}
                <button
                  onClick={handleViewAll}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors border-t border-border"
                >
                  Xem tất cả kết quả cho "{query}"
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : query.trim() ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Không tìm thấy sản phẩm nào cho "{query}"
                </p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchDropdown;
