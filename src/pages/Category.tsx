import React, { useState, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileNavBar from "../components/MobileNavBar";
import ProductCard from "../components/ProductCard";
import { products, categories, brands } from "../data/products";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/Checkbox";
import { Slider } from "../components/ui/slider";
import { Input } from "../components/ui/input";
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
  const subcategory = searchParams.get("sub");

  // Find category by slug
  const category = useMemo(() => {
    return categories.find(
      (c) =>
        c.name.toLowerCase().replace(/\s+/g, "-") === slug ||
        c.name === decodeURIComponent(slug || ""),
    );
  }, [slug]);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const skinTypes = [
    "Da dầu",
    "Da khô",
    "Da hỗn hợp",
    "Da nhạy cảm",
    "Mọi loại da",
  ];

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (category) {
      result = result.filter((p) => p.category === category.name);
    }

    // Filter by subcategory
    if (subcategory) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(subcategory.toLowerCase()) ||
          (p.skinType &&
            p.skinType.some((st) =>
              st.toLowerCase().includes(subcategory.toLowerCase()),
            )),
      );
    }

    // Filter by price
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1],
    );

    // Filter by brands
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // Filter by skin type
    if (selectedSkinTypes.length > 0) {
      result = result.filter(
        (p) =>
          p.skinType && p.skinType.some((st) => selectedSkinTypes.includes(st)),
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "discount":
        result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      default:
        // newest - keep original order
        break;
    }

    return result;
  }, [
    category,
    subcategory,
    priceRange,
    selectedBrands,
    selectedSkinTypes,
    sortBy,
  ]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "₫";
  };

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
            <label className="text-xs text-muted-foreground mb-1 block">
              Từ
            </label>
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) => {
                const val = Math.max(
                  0,
                  Math.min(Number(e.target.value), priceRange[1]),
                );
                setPriceRange([val, priceRange[1]]);
              }}
              className="h-8 text-xs"
              min={0}
              max={priceRange[1]}
              step={10000}
            />
          </div>
          <span className="text-muted-foreground mt-5">—</span>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">
              Đến
            </label>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) => {
                const val = Math.min(
                  2000000,
                  Math.max(Number(e.target.value), priceRange[0]),
                );
                setPriceRange([priceRange[0], val]);
              }}
              className="h-8 text-xs"
              min={priceRange[0]}
              max={2000000}
              step={10000}
            />
          </div>
        </div>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={2000000}
          step={10000}
          minStepsBetweenThumbs={1}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0₫</span>
          <span>2.000.000₫</span>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-semibold mb-3">Thương hiệu</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map((brand) => (
            <label
              key={brand.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={selectedBrands.includes(brand.name)}
                onCheckedChange={() => toggleBrand(brand.name)}
              />
              <span className="text-sm">{brand.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Skin Type */}
      <div>
        <h3 className="font-semibold mb-3">Loại da</h3>
        <div className="space-y-2">
          {skinTypes.map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 cursor-pointer"
            >
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
          <X className="w-4 h-4 mr-2" />
          Xóa bộ lọc
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
          <Link to="/" className="hover:text-primary">
            Trang chủ
          </Link>
          <ChevronRight className="w-4 h-4" />
          {category ? (
            <>
              <Link to={`/category/${slug}`} className="hover:text-primary">
                {category.name}
              </Link>
              {subcategory && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-foreground">{subcategory}</span>
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
              {category ? category.name : "Tất cả sản phẩm"}
              {subcategory && ` - ${subcategory}`}
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredProducts.length} sản phẩm
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden">
                  <Filter className="w-4 h-4 mr-2" />
                  Bộ lọc
                  {hasActiveFilters && (
                    <span className="ml-2 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                      !
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Bộ lọc sản phẩm</SheetTitle>
                </SheetHeader>
                <div className="mt-6">{filterContent}</div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="price-asc">Giá thấp đến cao</SelectItem>
                <SelectItem value="price-desc">Giá cao đến thấp</SelectItem>
                <SelectItem value="name">Tên A-Z</SelectItem>
                <SelectItem value="discount">Giảm giá nhiều</SelectItem>
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
                  <Filter className="w-5 h-5" />
                  Bộ lọc
                </h2>
                {filterContent}
              </CardContent>
            </Card>

            {/* Subcategories */}
            {category && category.subcategories.length > 0 && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <h2 className="font-semibold text-lg mb-3">Danh mục con</h2>
                  <div className="space-y-2">
                    {category.subcategories.map((sub, index) => (
                      <Link
                        key={index}
                        to={`/category/${slug}?sub=${encodeURIComponent(sub)}`}
                        className={`block text-sm py-1.5 px-2 rounded hover:bg-secondary transition-colors ${
                          subcategory === sub
                            ? "bg-primary/10 text-primary font-medium"
                            : ""
                        }`}
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground mb-4">
                    Không tìm thấy sản phẩm phù hợp
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Xóa bộ lọc
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
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
