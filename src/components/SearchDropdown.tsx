import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { products } from "../data/products";
import type { Product } from "../data/products";
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
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter products based on query
  useEffect(() => {
    if (query.trim().length > 0) {
      const searchTerm = query.toLowerCase().trim();
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.brand.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm),
      );
      setFilteredProducts(filtered.slice(0, 6)); // Limit to 6 results
      setIsOpen(true);
    } else {
      setFilteredProducts([]);
      setIsOpen(false);
    }
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
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
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
            onFocus={() => query.trim() && setIsOpen(true)}
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
        {isOpen && filteredProducts.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50 ${isMobile ? "mx-0" : ""}`}
          >
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sản phẩm ({filteredProducts.length})
              </p>

              <div className="space-y-1">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-secondary rounded-lg transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.brand}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-primary">
                        {formatPrice(product.price)}
                      </p>
                      {product.discount > 0 && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.originalPrice)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
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
          </motion.div>
        )}

        {isOpen && query.trim() && filteredProducts.length === 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Không tìm thấy sản phẩm nào cho "{query}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchDropdown;
