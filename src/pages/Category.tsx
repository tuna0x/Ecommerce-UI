import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
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
import { Loader2, ChevronRight, Filter, SlidersHorizontal, X } from "lucide-react";
import { BannerService } from "../service/bannerService";
import type { IBanner } from "../types/banner.type";
import { formatNumberWithDots, parseNumberFromDots } from "../lib/numberUtils";
import { cn } from "../lib/utils";
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
import { logActivity } from "../service/trackingService";
import SEO from "../components/ui/SEO";

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

  const [currentPage, setCurrentPage] = useState(0); 
  const [categoryBanners, setCategoryBanners] = useState<IBanner[]>([]);

  const category = useMemo(() => {
    return categories.find(
      (c) =>
        c.slug === slug ||
        c.name.toLowerCase().replace(/\s+/g, "-") === slug ||
        c.name === decodeURIComponent(slug || ""),
    );
  }, [slug, categories]);

  const activeCategoryNode = useMemo(() => {
    if (!category) return undefined;

    if (subcategoryName && subSubcategoryName) {
      const level2 = category.children?.find(c => c.name === subcategoryName);
      const level3 = level2?.children?.find(c => c.name === subSubcategoryName);
      if (level3) return level3;
    }

    if (subcategoryName) {
      return category.children?.find(c => c.name === subcategoryName) || category;
    }

    return category;
  }, [category, subcategoryName, subSubcategoryName]);

  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState(priceRange);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt,desc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const getDescendantIds = useCallback((node: FrontendCategory): number[] => {
    let ids = [node.id];
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        ids = [...ids, ...getDescendantIds(child)];
      });
    }
    return ids;
  }, []);

  const findCategoryById = useCallback((nodes: FrontendCategory[], id: number): FrontendCategory | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const child = findCategoryById(node.children || [], id);
      if (child) return child;
    }
    return undefined;
  }, []);

  const flattenCategories = useCallback((nodes: FrontendCategory[], level = 0): Array<FrontendCategory & { level: number }> => {
    return nodes.flatMap(node => [
      { ...node, level },
      ...flattenCategories(node.children || [], level + 1),
    ]);
  }, []);

  const escapeFilterValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  useEffect(() => {
    const brandParam = searchParams.get("brand");
    if (!brandParam || brandsList.length === 0) return;

    const matchedBrand = brandsList.find(
      brand => brand.name.toLowerCase() === brandParam.toLowerCase()
    );

    if (matchedBrand) {
      setSelectedBrands([matchedBrand.id]);
    }
  }, [searchParams, brandsList]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [priceRange]);

  const fetchBrands = async () => {
    try {
      const pageSize = 100;
      const firstPage = await BrandService.getAll(1, pageSize, undefined, "name,asc");
      const firstResult = firstPage.data?.result || [];
      const totalPages = firstPage.data?.meta?.pages || 1;

      if (totalPages <= 1) {
        setBrandsList(firstResult);
        return;
      }

      const restPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          BrandService.getAll(index + 2, pageSize, undefined, "name,asc")
        )
      );

      setBrandsList([
        ...firstResult,
        ...restPages.flatMap(res => res.data?.result || []),
      ]);
    } catch (error) {
      console.error("Failed to fetch brands", error);
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: string[] = ["active:true"];

      if (activeCategoryNode && slug !== "all") {
        const descendantIds = getDescendantIds(activeCategoryNode);
        if (descendantIds.length > 0) {
          const catFilters = descendantIds.map(id => `category.id:${id}`).join(" or ");
          filters.push(`(${catFilters})`);
        }
      }

      if (selectedBrands.length > 0) {
        const brandFilters = selectedBrands.map(id => `brand.id:${id}`).join(" or ");
        filters.push(`(${brandFilters})`);
      }

      if (selectedSkinTypes.length > 0) {
        const skinFilters = selectedSkinTypes.map(s => `skinType:'${escapeFilterValue(s)}'`).join(" or ");
        filters.push(`(${skinFilters})`);
      }

      if (slug === "all" && selectedCategories.length > 0) {
        const selectedCategoryIds = selectedCategories.flatMap(categoryId => {
          const selectedCategory = findCategoryById(categories, categoryId);
          return selectedCategory ? getDescendantIds(selectedCategory) : [categoryId];
        });
        const uniqueCategoryIds = Array.from(new Set(selectedCategoryIds));
        const catFilters = uniqueCategoryIds.map(id => `category.id:${id}`).join(" or ");
        filters.push(`(${catFilters})`);
      }

      filters.push(`price>=${debouncedPriceRange[0]}`);
      filters.push(`price<=${debouncedPriceRange[1]}`);

      const filterString = filters.join(" and ");

      const res = await ProductService.getAll(
        currentPage,
        meta.pageSize,
        undefined,
        sortBy,
        filterString,
        undefined,
        true
      );

      if (res.data) {
        setProductsList(res.data.result);
        setMeta(res.data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategoryNode, currentPage, meta.pageSize, selectedBrands, selectedSkinTypes, selectedCategories, debouncedPriceRange, sortBy, slug, categories, findCategoryById, getDescendantIds]);

  const fetchCategoryBanners = useCallback(async () => {
    try {
      const res = await BannerService.getAll(0, 50);
      if (res.data?.result) {
        const currentPath = `/category/${slug}`;
        const matchedBanners = res.data.result.filter(
          (b) => b.isActive && 
                 b.position?.toLowerCase() === "category" && 
                 b.link === currentPath
        ).sort((a, b) => a.order - b.order);
        
        setCategoryBanners(matchedBanners);
      }
    } catch (error) {
      console.error("Failed to fetch category banners", error);
    }
  }, [slug]);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategoryBanners();
    if (activeCategoryNode) {
      logActivity('VIEW_CATEGORY', {
        categoryId: activeCategoryNode.id,
        categoryName: activeCategoryNode.name,
        productCount: meta.total
      });
    }
  }, [fetchProducts, activeCategoryNode?.id]);

  useEffect(() => {
    setCurrentPage(0);
  }, [slug, subcategoryName, subSubcategoryName, selectedBrands, selectedSkinTypes, selectedCategories, debouncedPriceRange, sortBy]);

  const skinTypes = ["Da dầu", "Da khô", "Da hỗn hợp", "Da nhạy cảm", "Mọi loại da"];

  const toggleBrand = (brandId: number) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId],
    );
  };

  const toggleSkinType = (type: string) => {
    setSelectedSkinTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  };

  const clearFilters = () => {
    setPriceRange([0, 5000000]);
    setDebouncedPriceRange([0, 5000000]);
    setSelectedBrands([]);
    setSelectedSkinTypes([]);
    setSelectedCategories([]);
    setSortBy("createdAt,desc");
    setCurrentPage(0);
  };

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedSkinTypes.length > 0 ||
    selectedCategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 5000000;

  const isSortChanged = sortBy !== "createdAt,desc";
  const hasAnyActiveFilter = hasActiveFilters || isSortChanged;

  const sortOptions = [
    { value: "createdAt,desc", label: "Mới nhất" },
    { value: "price,asc", label: "Giá thấp đến cao" },
    { value: "price,desc", label: "Giá cao đến thấp" },
    { value: "name,asc", label: "Tên A-Z" },
    { value: "soldCount,desc", label: "Bán chạy nhất" },
  ];

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label;
  const selectedBrandItems = selectedBrands
    .map(id => brandsList.find(brand => brand.id === id))
    .filter((brand): brand is IBrand => Boolean(brand));
  const selectedCategoryItems = selectedCategories
    .map(id => findCategoryById(categories, id))
    .filter((cat): cat is FrontendCategory => Boolean(cat));
  const filterCategories = flattenCategories(categories);
  const visibleBrands = showAllBrands ? brandsList : brandsList.slice(0, 8);
  const visibleCategories = showAllCategories ? filterCategories : filterCategories.slice(0, 8);

  const filterContent = (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Khoảng giá</h3>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: "Dưới 500k", range: [0, 500000] },
            { label: "500k - 1tr", range: [500000, 1000000] },
            { label: "1tr - 2tr", range: [1000000, 2000000] },
            { label: "Trên 2tr", range: [2000000, 5000000] },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setPriceRange(preset.range);
                setDebouncedPriceRange(preset.range);
              }}
              className={cn(
                "px-2 py-1 text-[10px] font-medium rounded-full border transition-all",
                priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1]
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider font-semibold">Từ</label>
            <div className="relative">
              <Input
                type="text"
                value={formatNumberWithDots(priceRange[0])}
                onChange={(e) => {
                  const val = parseNumberFromDots(e.target.value);
                  setPriceRange([val, priceRange[1]]);
                }}
                className="h-9 text-xs font-bold pl-2"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">₫</span>
            </div>
          </div>
          <span className="text-muted-foreground mt-5">—</span>
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider font-semibold">Đến</label>
            <div className="relative">
              <Input
                type="text"
                value={formatNumberWithDots(priceRange[1])}
                onChange={(e) => {
                  const val = parseNumberFromDots(e.target.value);
                  setPriceRange([priceRange[0], val]);
                }}
                className="h-9 text-xs font-bold pl-2"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">₫</span>
            </div>
          </div>
        </div>
        
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={5000000}
          step={50000}
          className="mb-2"
        />
        <div className="flex justify-between mt-1 px-1">
          <span className="text-[9px] text-muted-foreground">0₫</span>
          <span className="text-[9px] text-muted-foreground">5.000.000₫</span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Thương hiệu</h3>
        <div className="space-y-2">
          {visibleBrands.map((brand) => (
            <label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={selectedBrands.includes(brand.id)}
                onCheckedChange={() => toggleBrand(brand.id)}
              />
              <span className="text-sm group-hover:text-primary transition-colors">{brand.name}</span>
            </label>
          ))}
          {brandsList.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllBrands(prev => !prev)}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {showAllBrands ? "Ẩn bớt" : `Hiện tất cả (${brandsList.length})`}
            </button>
          )}
        </div>
      </div>

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

      {slug === "all" && filterCategories.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Danh mục</h3>
          <div className="space-y-2">
            {visibleCategories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                <Checkbox
                  checked={selectedCategories.includes(cat.id)}
                  onCheckedChange={() => toggleCategory(cat.id)}
                />
                <span
                  className="text-sm group-hover:text-primary transition-colors"
                  style={{ paddingLeft: `${cat.level * 12}px` }}
                >
                  {cat.name}
                </span>
              </label>
            ))}
            {filterCategories.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllCategories(prev => !prev)}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {showAllCategories ? "Ẩn bớt" : `Hiện tất cả (${filterCategories.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="w-4 h-4 mr-2" /> Xóa bộ lọc
        </Button>
      )}
    </div>
  );

  return (
    <>
      <SEO 
        title={activeCategoryNode ? activeCategoryNode.name : (category ? category.name : "Tất cả sản phẩm")}
        description={`Khám phá bộ sưu tập ${activeCategoryNode?.name || category?.name || "sản phẩm"} tại Bông Cosmetic. Hiện có ${meta.total} sản phẩm chất lượng, chính hãng.`}
        url={`/category/${slug}`}
      />

      <main className="container mx-auto px-4 py-6">
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

        {categoryBanners.length > 0 && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="relative w-full aspect-[21/6] md:aspect-[21/5] rounded-3xl overflow-hidden shadow-xl border border-border/50 group">
              <img 
                src={categoryBanners[0].image} 
                alt={categoryBanners[0].title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex flex-col justify-center px-8 md:px-16 text-white">
                <motion.span className="text-xs md:text-sm font-bold tracking-widest uppercase mb-2 text-primary-foreground/90">
                  {categoryBanners[0].subtitle || "Khám phá ngay"}
                </motion.span>
                <motion.h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-4 drop-shadow-md">
                  {categoryBanners[0].title}
                </motion.h2>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {activeCategoryNode ? activeCategoryNode.name : (category ? category.name : "Tất cả sản phẩm")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{meta.total} sản phẩm tìm thấy</p>
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
                <SelectItem value="price,asc">Giá thấp đến cao</SelectItem>
                <SelectItem value="price,desc">Giá cao đến thấp</SelectItem>
                <SelectItem value="name,asc">Tên A-Z</SelectItem>
                <SelectItem value="soldCount,desc">Bán chạy nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasAnyActiveFilter && (
          <div className="flex flex-wrap items-center gap-2 mb-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <span className="text-sm font-medium text-muted-foreground mr-1">Bộ lọc đang chọn:</span>
            
            {/* Price Chip */}
            {(priceRange[0] > 0 || priceRange[1] < 5000000) && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20 hover:bg-primary/20 transition-colors">
                <span className="font-bold">Giá: {priceRange[0].toLocaleString('vi-VN')}₫ - {priceRange[1].toLocaleString('vi-VN')}₫</span>
                <button 
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  onClick={() => {
                    setPriceRange([0, 5000000]);
                    setDebouncedPriceRange([0, 5000000]);
                }}><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Brand Chips */}
            {selectedBrandItems.map(brand => (
              <div key={brand.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20 hover:bg-primary/20 transition-colors">
                <span>{brand.name}</span>
                <button onClick={() => toggleBrand(brand.id)}><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}

            {/* Skin Type Chips */}
            {selectedSkinTypes.map(type => (
              <div key={type} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20 hover:bg-primary/20 transition-colors">
                <span>{type}</span>
                <button onClick={() => toggleSkinType(type)}><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}

            {/* Category Chips */}
            {selectedCategoryItems.map(cat => (
              <div key={cat.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20 hover:bg-primary/20 transition-colors">
                <span>{cat.name}</span>
                <button onClick={() => toggleCategory(cat.id)}><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}

            {/* Sort Chip */}
            {isSortChanged && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-full text-xs font-medium border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                <span>Sắp xếp: {currentSortLabel}</span>
                <button onClick={() => setSortBy("createdAt,desc")}><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-xs font-bold text-muted-foreground hover:text-destructive h-8 px-2"
            >
              Xóa tất cả
            </Button>
          </div>
        )}

        <div className="flex gap-6">
          <aside className="hidden md:block w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5" /> Bộ lọc
                </h2>
                {filterContent}
              </CardContent>
            </Card>

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
    </>
  );
};

export default Category;
