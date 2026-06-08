import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  LayoutGrid,
  X,
  Loader2
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import type { IProduct } from "../types/product.type";
import { ProductService } from "../service/productService";
import { categoryService } from "../service/categoryService";
import type { ICategory } from "../types/category.type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import SEO from "../components/ui/SEO";

const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const brandParam = searchParams.get("brand") || "";
  const categoryParam = searchParams.get("category") || "";

  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("id,desc");
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || "all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [categories, setCategories] = useState<ICategory[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let filter = "";
      const conditions: string[] = ["active:true"];

      if (brandParam) conditions.push(`brand.name:'${brandParam}'`);
      if (categoryParam) conditions.push(`category.name:'${categoryParam}'`);
      if (selectedCategory !== "all" && !categoryParam) conditions.push(`category.name:'${selectedCategory}'`);

      if (priceRange !== "all") {
        if (priceRange === "under200") conditions.push("price < 200000");
        else if (priceRange === "200-500") conditions.push("price >= 200000 and price <= 500000");
        else if (priceRange === "500-1000") conditions.push("price >= 500000 and price <= 1000000");
        else if (priceRange === "over1000") conditions.push("price > 1000000");
      }

      filter = conditions.join(" and ");

      const canUseDedicatedSearch =
        query.trim() &&
        !brandParam &&
        !categoryParam &&
        selectedCategory === "all" &&
        priceRange === "all" &&
        sortBy === "id,desc";

      const res = canUseDedicatedSearch
        ? await ProductService.search(0, 50, query)
        : await ProductService.getAll(0, 50, query, sortBy, filter || undefined, undefined, true);
      if (res.data) {
        setProducts(res.data.result);
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setLoading(false);
    }
  }, [query, brandParam, categoryParam, selectedCategory, priceRange, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll(0, 100);
        if (res.data) {
          setCategories(res.data.result);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const uniqueCategories = useMemo(() => {
    return categories.map(c => c.name);
  }, [categories]);

  const clearFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("brand");
    newParams.delete("category");
    setSearchParams(newParams);

    setSelectedCategory("all");
    setPriceRange("all");
    setSortBy("id,desc");
  };

  const hasActiveFilters = selectedCategory !== "all" || priceRange !== "all" || brandParam || categoryParam;
  const filteredProducts = products;

  return (
    <>
      <SEO 
        title={`Kết quả tìm kiếm: ${query}`}
        description={`Tìm thấy ${filteredProducts.length} sản phẩm phù hợp với từ khóa "${query}" tại Bông Cosmetic.`}
      />
      
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
                {brandParam ? `Thương hiệu: ${brandParam}` : categoryParam ? `Danh mục: ${categoryParam}` : `Kết quả tìm kiếm cho "${query}"`}
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
                <SelectItem value="id,desc">Mới nhất</SelectItem>
                <SelectItem value="price,asc">Giá thấp đến cao</SelectItem>
                <SelectItem value="price,desc">Giá cao đến thấp</SelectItem>
                <SelectItem value="discount,desc">Giảm giá nhiều</SelectItem>
                <SelectItem value="averageRating,desc">Đánh giá cao</SelectItem>
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Đang tải sản phẩm...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
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
    </>
  );
};

export default SearchResults;
