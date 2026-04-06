import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Star,
  ShoppingBag,
  Minus,
  Plus,
  Check,
  Loader2,
  ChevronLeft,
  Heart,
  ZoomIn,
  Shield,
  FileText
} from "lucide-react";
import { ProductService } from "../service/productService";
import productDetailService from "../service/productDetailService";
import { attributeValueService } from "../service/attributeService";
import type { IProduct } from "../types/product.type";
import type { IProductDetail } from "../types/productDetail.type";
import type { IApiResponse } from "../types/api.type";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import ProductReviews from "../components/ProductReviews";
import ProductDetailSidebar from "../components/ProductDetailSidebar";
import ImageLightbox from "../components/ImageLightBox";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { cn } from "../lib/utils";
import CartSidebar from "../components/CartSidebar";
import MobileNavBar from "../components/MobileNavBar";
import { useAuth } from "../context/AuthContext";

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [detailContent, setDetailContent] = useState<IProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "ingredient" | "usage" | "specification" | "reviews">("description");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const prodId = Number(id);
      const [prodRes, detailRes] = await Promise.all([
        ProductService.getById(prodId),
        productDetailService.getByProductId(prodId)
      ]);

      if (prodRes?.data) {
        setProduct(prodRes.data);
        // Fetch related products and category attributes
        const categoryId = typeof prodRes.data.category === 'object' ? prodRes.data.category.id : null;
        const categoryName = typeof prodRes.data.category === 'string' ? prodRes.data.category : prodRes.data.category?.name;

        const promises: Promise<IApiResponse<any>>[] = [];

        if (categoryName) {
          promises.push(ProductService.getAll(0, 4, undefined, "id,desc", `category.name:'${categoryName}'`));
        }

        if (categoryId) {
          promises.push(attributeValueService.getAll(`attribute.categories.id:'${categoryId}'`));
        }

        const results = await Promise.all(promises);

        if (categoryName && results[0]?.data) {
          setRelatedProducts(results[0].data.result.filter((p: IProduct) => p.id !== prodId));
        }
      }

      if (detailRes.data && detailRes.data.result.length > 0) {
        setDetailContent(detailRes.data.result[0]);
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    window.scrollTo(0, 0);
  }, [fetchData]);

  const images = useMemo(() => {
    if (!product) return [];
    const imgs: string[] = [];
    if (product.thumbnail) imgs.push(product.thumbnail);
    if (Array.isArray(product.image)) {
      product.image.forEach(img => {
        if (!imgs.includes(img)) imgs.push(img);
      });
    } else if (typeof product.image === 'string') {
      if (!imgs.includes(product.image)) imgs.push(product.image);
    }
    return imgs;
  }, [product]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Group all attributes by name from variants for the selector
  const groupedAttributes = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return [];

    const groups: Record<string, Set<string>> = {};

    product.variants.forEach(v => {
      v.variantAttributes.forEach(va => {
        if (!groups[va.name]) groups[va.name] = new Set();
        groups[va.name].add(va.attributeValue);
      });
    });

    return Object.entries(groups).map(([name, values]) => ({
      name,
      values: Array.from(values)
    }));
  }, [product]);

  // Static attributes for the specifications tab
  const staticAttributes = useMemo(() => {
    if (!product || !product.attributeValue) return [];
    return product.attributeValue;
  }, [product]);

  // Find the variant that matches selected attributes
  const matchedVariant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return null;

    return product.variants.find(v => {
      // Every selected attribute must match the variant's attributes
      return Object.entries(selectedAttributes).every(([attrName, selectedVal]) => {
        return v.variantAttributes.some(va => va.name === attrName && va.attributeValue === selectedVal);
      });
    });
  }, [product, selectedAttributes]);

  // Pre-select attributes and sync with current groups
  useEffect(() => {
    if (groupedAttributes.length > 0) {
      const validNames = new Set(groupedAttributes.map(a => a.name));
      const newSelection: Record<string, string> = {};
      let changed = false;

      // 1. Keep only valid attributes that are still in groupedAttributes
      Object.entries(selectedAttributes).forEach(([name, val]) => {
        if (validNames.has(name)) {
          newSelection[name] = val;
        } else {
          changed = true; // Stale attribute removed
        }
      });

      // 2. Pre-select missing attributes
      groupedAttributes.forEach(attr => {
        if (attr.values.length > 0 && !newSelection[attr.name]) {
          newSelection[attr.name] = attr.values[0];
          changed = true;
        }
      });

      if (changed) {
        setSelectedAttributes(newSelection);
      }
    }
  }, [groupedAttributes, selectedAttributes]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground animate-pulse">Đang tải thông tin sản phẩm...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-secondary/20 p-6 rounded-full mb-4">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Không tìm thấy sản phẩm</h2>
          <p className="text-muted-foreground mb-6">Sản phẩm bạn đang tìm kiếm có thể đã bị gỡ bỏ hoặc không tồn tại.</p>
          <Link to="/" className="btn-primary px-8">
            Quay lại trang chủ
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const categoryName = typeof product.category === 'string' ? product.category : product.category?.name || "Sản phẩm";
  const brandName = typeof product.brand === 'string' ? product.brand : product.brand?.name || "Thương hiệu";

  // Use price and stock from matched variant if available
  const displayPrice = matchedVariant?.finalPrice || matchedVariant?.price || product.finalPrice || product.price || product.originalPrice;
  const displayOriginalPrice = matchedVariant?.price || product.originalPrice || 0;
  const currentStock = matchedVariant ? matchedVariant.stock : (product.stock || 0);

  const ratingValue = product.averageRating || product.rating || 5.0;
  const reviewsCount = product.reviewCount || 0;
  const discount = product.discount || (displayOriginalPrice > displayPrice ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100) : 0);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    addToCart(product, matchedVariant?.id || null, matchedVariant?.variantAttributes || null, quantity);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <CartSidebar />

      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4 md:mb-6">
          <Link to="/" className="hover:text-primary flex items-center gap-1 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Trang chủ
          </Link>
          <span>/</span>
          <Link
            to={`/search?category=${encodeURIComponent(categoryName)}`}
            className="hover:text-primary transition-colors"
          >
            {categoryName}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[150px] sm:max-w-none">{product.name}</span>
        </div>

        {/* Product Section Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_320px] gap-6 md:gap-8 mb-12">
          {/* Column 1: Image Gallery */}
          <div className="space-y-3">
            <div
              className="relative aspect-square bg-secondary/30 rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              <div className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors">
                <ZoomIn className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 snap-start ${selectedImage === index
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border/50 hover:border-primary/50'
                    }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Product Info */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <Link
                to={`/search?brand=${encodeURIComponent(brandName)}`}
                className="text-primary font-medium text-sm mb-1 hover:underline block"
              >
                {brandName}
              </Link>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{ratingValue}</span>
                </div>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">{reviewsCount} đánh giá</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">Đã bán {product.soldCount || 0}</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-3 sm:p-4 rounded-xl">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  {formatPrice(displayPrice)}
                </span>
                {displayOriginalPrice > displayPrice && (
                  <>
                    <span className="text-base sm:text-lg text-muted-foreground line-through">
                      {formatPrice(displayOriginalPrice)}
                    </span>
                    <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold">-{discount}%</span>
                  </>
                )}
              </div>
            </div>

            {/* Dynamic Attributes */}
            {groupedAttributes.map((attr, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-sm font-medium">{attr.name}</p>
                <div className="flex flex-wrap gap-2">
                  {attr.values.map((val, vIdx) => {
                    const isSelected = selectedAttributes[attr.name] === val;
                    return (
                      <button
                        key={vIdx}
                        onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: val }))}
                        className={cn(
                          "px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200",
                          isSelected
                            ? "border-primary bg-primary text-white shadow-sm"
                            : "border-primary/20 text-primary hover:bg-primary/5"
                        )}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <p className="text-sm font-medium mb-2">Số lượng</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 sm:p-3 hover:bg-secondary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 sm:w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2.5 sm:p-3 hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {currentStock > 0 && (
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Còn {currentStock} sản phẩm
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                THÊM VÀO GIỎ HÀNG
              </button>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                  } else {
                    import('sonner').then(({ toast }) => toast.info("Đã thêm vào danh sách yêu thích!"));
                  }
                }}
                className="p-3 sm:p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => {
                  import('sonner').then(({ toast }) => toast.info("Link sản phẩm đã được copy!"));
                  navigator.clipboard.writeText(window.location.href);
                }}
                className="p-3 sm:p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Column 3: Sticky Sidebar */}
          <div className="md:col-span-2 lg:col-span-1">
            <ProductDetailSidebar product={product} />
          </div>
        </div>

        {/* Product Details & Tabs */}
        <div className="mb-12 pt-12 border-t border-border/30">
          <div className="flex border-b border-border mb-8 overflow-x-auto scrollbar-none sticky top-[72px] bg-background z-10 py-2">
            {(["description", "ingredient", "usage", "specification", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab === "description" && "Mô tả"}
                {tab === "ingredient" && "Thành phần"}
                {tab === "usage" && "Cách dùng"}
                {tab === "specification" && "Thông số"}
                {tab === "reviews" && `Đánh giá (${reviewsCount})`}
              </button>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "description" && (
                  <div
                    className="prose prose-lg max-w-none prose-p:text-muted-foreground prose-p:leading-relaxed prose-headings:text-foreground prose-img:rounded-3xl prose-img:shadow-xl"
                    dangerouslySetInnerHTML={{ __html: detailContent?.description || '<p class="italic text-muted-foreground">Hiện chưa có mô tả chi tiết cho sản phẩm này.</p>' }}
                  />
                )}

                {activeTab === "ingredient" && (
                  <div className="bg-secondary/20 p-8 rounded-3xl border border-border">
                    <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                      <Shield className="w-6 h-6" />
                      Bảng thành phần
                    </h3>
                    <div
                      className="prose prose-sm max-w-none text-muted-foreground leading-loose"
                      dangerouslySetInnerHTML={{ __html: detailContent?.ingredient || "Đang cập nhật bảng thành phần chi tiết..." }}
                    />
                  </div>
                )}

                {activeTab === "usage" && (
                  <div className="bg-secondary/20 p-8 rounded-3xl border border-border">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-primary">
                      <Check className="w-6 h-6" />
                      Hướng dẫn sử dụng
                    </h3>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: detailContent?.usageGuide || '<p class="text-muted-foreground italic">Liên hệ bộ phận tư vấn để được hướng dẫn sử dụng tốt nhất.</p>' }}
                    />
                  </div>
                )}

                {activeTab === "specification" && (
                  <div className="bg-accent/5 p-8 rounded-3xl border border-border/50">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-accent">
                      <FileText className="w-6 h-6" />
                      Thông số sản phẩm
                    </h3>
                    {staticAttributes.length > 0 ? (
                      <div className="grid gap-4">
                        {staticAttributes.map((attr, idx) => (
                          <div key={idx} className="flex justify-between py-3 border-b border-border/30 last:border-0">
                            <span className="text-muted-foreground">{attr.attributeValue}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: detailContent?.specification || '<p class="text-muted-foreground italic">Chưa có thông số kỹ thuật chi tiết.</p>' }}
                      />
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="-mt-4">
                    <ProductReviews
                      productId={product.id}
                      productRating={ratingValue}
                      reviewCount={reviewsCount}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="pt-8 md:pt-12">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold">Sản phẩm liên quan</h2>
              <Link to={`/category/${categoryName}`} className="text-primary font-bold hover:underline">Xem tất cả</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
      <MobileNavBar />

      <ImageLightbox
        images={images}
        currentIndex={selectedImage}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(i) => setSelectedImage(i)}
      />
    </div>
  );
};

export default ProductDetail;
