import React, { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  LayoutGrid,
  X,
} from "lucide-react";
import TopBar from "../components/TopBar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileNavBar from "../components/MobileNavBar";
import CartSidebar from "../components/CartSidebar";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";
import type { IProduct } from "../types/product.type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [sortBy, setSortBy] = useState("relevant");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let results = products as unknown as IProduct[];

    // Search filter
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      results = results.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          (typeof product.brand === "string" ? product.brand : product.brand.name).toLowerCase().includes(searchTerm) ||
          (typeof product.category === "string" ? product.category : product.category.name).toLowerCase().includes(searchTerm) ||
          product.concern?.some((c) => c.toLowerCase().includes(searchTerm)) ||
          product.skinType?.some((s) => s.toLowerCase().includes(searchTerm)),
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      results = results.filter(
        (product) => (typeof product.category === "string" ? product.category : product.category.name) === selectedCategory,
      );
    }

    // Price range filter
    if (priceRange !== "all") {
      switch (priceRange) {
        case "under200":
          results = results.filter((product) => (product.finalPrice || product.price || 0) < 200000);
          break;
        case "200-500":
          results = results.filter(
            (product) => (product.finalPrice || product.price || 0) >= 200000 && (product.finalPrice || product.price || 0) <= 500000,
          );
          break;
        case "500-1000":
          results = results.filter(
            (product) => (product.finalPrice || product.price || 0) >= 500000 && (product.finalPrice || product.price || 0) <= 1000000,
          );
          break;
        case "over1000":
          results = results.filter((product) => (product.finalPrice || product.price || 0) > 1000000);
          break;
      }
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        results = [...results].sort((a, b) => (a.finalPrice || a.price || 0) - (b.finalPrice || b.price || 0));
        break;
      case "price-desc":
        results = [...results].sort((a, b) => (b.finalPrice || b.price || 0) - (a.finalPrice || a.price || 0));
        break;
      case "discount":
        results = [...results].sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      case "rating":
        results = [...results].sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0));
        break;
      case "relevant":
      default:
        break;
    }

    return results;
  }, [query, selectedCategory, priceRange, sortBy]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set((products as unknown as IProduct[]).map((p) => 
      typeof p.category === "string" ? p.category : p.category.name
    ));
    return Array.from(cats);
  }, []);

  const clearFilters = () => {
    setSelectedCategory("all");
    setPriceRange("all");
    setSortBy("relevant");
  };

  const hasActiveFilters = selectedCategory !== "all" || priceRange !== "all";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <TopBar />
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-foreground">Tìm kiếm</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                Kết quả tìm kiếm cho "{query}"
              </h1>
              <p className="text-muted-foreground">
                Tìm thấy {filteredProducts.length} sản phẩm
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg text-sm font-medium"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc
            </button>

            <div className="hidden md:flex items-center gap-3">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Khoảng giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả giá</SelectItem>
                  <SelectItem value="under200">Dưới 200.000₫</SelectItem>
                  <SelectItem value="200-500">200.000₫ - 500.000₫</SelectItem>
                  <SelectItem value="500-1000">
                    500.000₫ - 1.000.000₫
                  </SelectItem>
                  <SelectItem value="over1000">Trên 1.000.000₫</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevant">Liên quan nhất</SelectItem>
                <SelectItem value="price-asc">Giá thấp đến cao</SelectItem>
                <SelectItem value="price-desc">Giá cao đến thấp</SelectItem>
                <SelectItem value="discount">Giảm giá nhiều</SelectItem>
                <SelectItem value="rating">Đánh giá cao</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden md:flex items-center bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-background shadow-sm" : ""
                  }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("compact")}
                className={`p-2 rounded-md transition-colors ${viewMode === "compact" ? "bg-background shadow-sm" : ""
                  }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden mb-6 p-4 bg-secondary/50 rounded-xl space-y-4"
          >
            <div>
              <label className="text-sm font-medium mb-2 block">Danh mục</label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm text-destructive hover:text-destructive/80 transition-colors"
            >
              <X className="w-4 h-4" />
              Xóa tất cả bộ lọc
            </button>
          </motion.div>
        )}

        {filteredProducts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`grid gap-4 ${viewMode === "grid"
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              }`}
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h2 className="text-xl font-semibold mb-2">Không tìm thấy sản phẩm</h2>
            <Link
              to="/"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              Quay lại trang chủ
            </Link>
          </div>
        )}
      </main>

      <CartSidebar />
      <Footer />
      <MobileNavBar />
    </div>
  );
};

export default SearchResults;
