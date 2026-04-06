import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileNavBar from "../components/MobileNavBar";
import ProductCard from "../components/ProductCard";
import { useCategories } from "../hooks/useCategories";
import type { FrontendCategory } from "../hooks/useCategories";
import { ProductService } from "../service/productService";
import { BrandService } from "../service/brandService";
import type { IProduct } from "../types/product.type";
import type { IBrand } from "../types/brand.type";
import type { IMeta } from "../types/api.type";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/Checkbox";
import { Slider } from "../components/ui/slider";
import { Input } from "../components/ui/input";
import PaginationControl from "../components/PaginationControl";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";
import { ChevronRight, Filter, SlidersHorizontal, X } from "lucide-react";

const Category = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const subcategoryName = searchParams.get("sub");
  const subSubcategoryName = searchParams.get("sub2");

  const { data: categories = [] } = useCategories();

  // API Data States
  const [productsList, setProductsList] = useState<IProduct[]>([]);
  const [brandsList, setBrandsList] = useState<IBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<IMeta>({
    page: 0,
    pageSize: 12,
    pages: 1,
    total: 0,
  });

  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for API

  // Find root category by slug
  const category = useMemo(() => {
    return categories.find(
      (c) =>
        c.slug === slug ||
        c.name.toLowerCase().replace(/\s+/g, "-") === slug ||
        c.name === decodeURIComponent(slug || ""),
    );
  }, [slug, categories]);

  // Find active node in the hierarchy (Level 1, 2, or 3)
  const activeCategoryNode = useMemo(() => {
    if (!category) return undefined;

    // Level 3 Check
    if (subcategoryName && subSubcategoryName) {
      const level2 = category.children?.find(c => c.name === subcategoryName);
      const level3 = level2?.children?.find(c => c.name === subSubcategoryName);
      if (level3) return level3;
    }

    // Level 2 Check
    if (subcategoryName) {
      return category.children?.find(c => c.name === subcategoryName) || category;
    }

    return category;
  }, [category, subcategoryName, subSubcategoryName]);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("createdAt,desc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchBrands = async () => {
    try {
      const res = await BrandService.getAll(1, 50, undefined, "name,asc");
      if (res.data?.result) {
        setBrandsList(res.data.result);
      }
    } catch (error) {
      console.error("Failed to fetch brands", error);
    }
  };

  const fetchProducts = useCallback(async () => {
    // Collect all category IDs in a subtree
    const getDescendantIds = (node: FrontendCategory): number[] => {
      let ids = [node.id];
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          ids = [...ids, ...getDescendantIds(child)];
        });
      }
      return ids;
    };

    try {
      setIsLoading(true);
      const filters = [];

      // Hierarchical Category Filter
      if (activeCategoryNode && slug !== "all") {
        const allIds = getDescendantIds(activeCategoryNode);
        if (allIds.length === 1) {
          filters.push(`category.id:${allIds[0]}`);
        } else {
          // Use space instead of comma for spring-filter IN clause
          filters.push(`category.id in (${allIds.join(" ")})`);
        }
      }

      // Brand filter
      if (selectedBrands.length > 0) {
        const brandFilters = selectedBrands.map(b => `brand.name:'${b}'`).join(" OR ");
        filters.push(`(${brandFilters})`);
      }

      // Price filter
      filters.push(`originalPrice >= ${priceRange[0]}`);
      filters.push(`originalPrice <= ${priceRange[1]}`);

      const filterString = filters.join(" AND ");

      const res = await ProductService.getAll(
        currentPage, // Use 0-indexed page
        meta.pageSize,
        undefined,
        sortBy,
        filterString
      );

      if (res.data) {
        setProductsList(res.data.result);
        // Update meta for display (e.g. meta.page will be currentPage + 1)
        setMeta(res.data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategoryNode, currentPage, meta.pageSize, selectedBrands, priceRange, sortBy, slug]);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page to 0 when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [slug, subcategoryName, subSubcategoryName, selectedBrands, priceRange, sortBy]);

  const skinTypes = [
    "Da dầu",
    "Da khô",
    "Da hỗn hợp",
    "Da nhạy cảm",
    "Mọi loại da",
  ];

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    );
  };

  const toggleSkinType = (type: string) => {
    setSelectedSkinTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const clearFilters = () => {
    setPriceRange([0, 2000000]);
    setSelectedBrands([]);
    setSelectedSkinTypes([]);
  };

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedSkinTypes.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 2000000;

  const filterContent = (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Khoảng giá</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Từ</label>
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Math.max(0, Number(e.target.value)), priceRange[1]])}
              className="h-8 text-xs"
            />
          </div>
          <span className="text-muted-foreground mt-5">—</span>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Đến</label>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Math.max(priceRange[0], Number(e.target.value))])}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={2000000}
          step={10000}
          className="mb-2"
        />
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-semibold mb-3">Thương hiệu</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {brandsList.map((brand) => (
            <label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={selectedBrands.includes(brand.name)}
                onCheckedChange={() => toggleBrand(brand.name)}
              />
              <span className="text-sm group-hover:text-primary transition-colors">{brand.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Skin Type */}
      <div>
        <h3 className="font-semibold mb-3">Loại da</h3>
        <div className="space-y-2">
          {skinTypes.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedSkinTypes.includes(type)}
                onCheckedChange={() => toggleSkinType(type)}
              />
              <span className="text-sm">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="w-4 h-4 mr-2" /> Xóa bộ lọc
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Trang chủ</Link>
          <ChevronRight className="w-4 h-4" />
          {category ? (
            <>
              <Link to={`/category/${category.slug}`} className="hover:text-primary">{category.name}</Link>
              {subcategoryName && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-foreground">{subcategoryName}</span>
                  {subSubcategoryName && (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-foreground">{subSubcategoryName}</span>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <span className="text-foreground">Tất cả sản phẩm</span>
          )}
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {activeCategoryNode ? activeCategoryNode.name : (category ? category.name : "Tất cả sản phẩm")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {meta.total} sản phẩm tìm thấy
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden">
                  <Filter className="w-4 h-4 mr-2" /> Bộ lọc
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader><SheetTitle>Bộ lọc sản phẩm</SheetTitle></SheetHeader>
                <div className="mt-6">{filterContent}</div>
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt,desc">Mới nhất</SelectItem>
                <SelectItem value="originalPrice,asc">Giá thấp đến cao</SelectItem>
                <SelectItem value="originalPrice,desc">Giá cao đến thấp</SelectItem>
                <SelectItem value="name,asc">Tên A-Z</SelectItem>
                <SelectItem value="soldCount,desc">Bán chạy nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5" /> Bộ lọc
                </h2>
                {filterContent}
              </CardContent>
            </Card>

            {/* Subcategories (Dynamic based on logic) */}
            {activeCategoryNode && activeCategoryNode.children && activeCategoryNode.children.length > 0 && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <h2 className="font-semibold text-lg mb-3">Danh mục con</h2>
                  <div className="space-y-2">
                    {activeCategoryNode.children.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/category/${category?.slug || slug}?sub=${encodeURIComponent(activeCategoryNode.parentId ? subcategoryName || "" : sub.name)}${activeCategoryNode.parentId ? `&sub2=${encodeURIComponent(sub.name)}` : ""}`}
                        className="block text-sm py-1.5 px-2 rounded hover:bg-secondary transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Đang tải sản phẩm...</p>
              </div>
            ) : productsList.length === 0 ? (
              <Card><CardContent className="py-16 text-center">
                <p className="text-muted-foreground mb-4">Không tìm thấy sản phẩm phù hợp</p>
                <Button variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button>
              </CardContent></Card>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productsList.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {meta.pages > 1 && (
                  <div className="mt-8">
                    <PaginationControl
                      currentPage={meta.page}
                      totalPages={meta.pages}
                      onPageChange={(page) => setCurrentPage(page - 1)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileNavBar />
    </div>
  );
};

export default Category;
