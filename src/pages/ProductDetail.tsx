import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Star,
  ShoppingBag,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  Check,
  Loader2,
  FileText,
} from "lucide-react";
import { ProductService } from "../service/productService";
import productDetailService from "../service/productDetailService";
import type { IProduct } from "../types/product.type";
import type { IProductDetail } from "../types/productDetail.type";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import ProductReviews from "../components/ProductReviews";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartSidebar from "../components/CartSidebar";
import MobileNavBar from "../components/MobileNavBar";

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [detail, setDetail] = useState<IProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "description" | "ingredient" | "usage" | "specification" | "reviews"
  >("description");

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const prodId = Number(id);
      const [prodRes, detailRes] = await Promise.all([
        ProductService.getById(prodId),
        productDetailService.getByProductId(prodId)
      ]);

      if (prodRes.data) {
        setProduct(prodRes.data);
        // Fetch related products
        const categoryName = typeof prodRes.data.category === 'string' ? prodRes.data.category : prodRes.data.category.name;
        const relatedRes = await ProductService.getAll(0, 4, undefined, `category.name:'${categoryName}'`);
        if (relatedRes.data) {
          setRelatedProducts(relatedRes.data.result.filter(p => p.id !== prodId));
        }
      }

      if (detailRes.data && detailRes.data.result.length > 0) {
        setDetail(detailRes.data.result[0]);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

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

  const images = Array.isArray(product.image) ? product.image : [];
  const displayPrice = product.price || product.originalPrice;
  const ratingValue = product.rating || 5.0;
  const reviewsCount = product.reviewCount || 0;

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <CartSidebar />

      <main className="container mx-auto py-4 md:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
          <Link to="/" className="hover:text-primary flex items-center gap-1">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to={`/category/${typeof product.category === 'string' ? product.category : product.category.name}`} className="hover:text-primary">
            {typeof product.category === 'string' ? product.category : product.category.name}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate">{product.name}</span>
        </div>

        {/* Product Section */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Images */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square bg-secondary/20 rounded-3xl overflow-hidden border border-border/50 group relative"
            >
              {images.length > 0 && (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              {product.discount && product.discount > 0 ? (
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  -{product.discount}%
                </div>
              ) : null}
            </motion.div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${selectedImage === index
                      ? "border-primary ring-2 ring-primary/20 scale-95"
                      : "border-transparent hover:border-primary/50"
                    }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div className="space-y-2">
            <Link to={`/search?brand=${typeof product.brand === 'string' ? product.brand : product.brand.name}`} className="text-primary font-bold tracking-wider text-sm uppercase hover:underline">
              {typeof product.brand === 'string' ? product.brand : product.brand.name}
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {product.name}
            </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-yellow-400/10 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-yellow-700">{ratingValue}</span>
                </div>
                <span className="text-muted-foreground">|</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {reviewsCount} đánh giá
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="text-sm font-medium text-muted-foreground">Đã bán 1.2k+</span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-secondary/30 p-6 rounded-3xl border border-border/50">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-black text-primary">
                  {formatPrice(displayPrice || 0)}
                </span>
                {(product.originalPrice || 0) > (displayPrice || 0) && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice || 0)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium italic">
                * Giá đã bao gồm thuế VAT
              </p>
            </div>

            {/* Volume/Variant */}
            {product.volume && (
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Dung tích
                </p>
                <div className="flex flex-wrap gap-2">
                  <button className="px-6 py-2.5 bg-primary/10 border-2 border-primary text-primary rounded-xl text-sm font-bold shadow-sm">
                    {product.volume}
                  </button>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Số lượng</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-muted rounded-2xl p-1.5 border border-border">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-background rounded-xl transition-all shadow-sm active:scale-90"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-lg leading-none">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-background rounded-xl transition-all shadow-sm active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {(product.stock || 0) > 0 && (
                  <div className="text-sm font-medium">
                    <span className="text-primary">{product.stock}</span> còn lại
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 h-14 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                <ShoppingBag className="w-6 h-6" />
                THÊM VÀO GIỎ HÀNG
              </button>
              <div className="flex gap-2">
                <button className="flex-1 h-14 border-2 border-border rounded-2xl flex items-center justify-center gap-2 hover:bg-secondary transition-all active:scale-95">
                  <Share2 className="w-5 h-5" />
                  Chia sẻ
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tight">Freeship 500K</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tight">Chính hãng 100%</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tight">Đổi trả 30 ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
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
                    dangerouslySetInnerHTML={{ __html: detail?.description || '<p class="italic text-muted-foreground">Hiện chưa có mô tả chi tiết cho sản phẩm này.</p>' }}
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
                      dangerouslySetInnerHTML={{ __html: detail?.ingredient || "Đang cập nhật bảng thành phần chi tiết..." }}
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
                      dangerouslySetInnerHTML={{ __html: detail?.usageGuide || '<p class="text-muted-foreground italic">Liên hệ bộ phận tư vấn để được hướng dẫn sử dụng tốt nhất.</p>' }}
                    />
                  </div>
                )}

                {activeTab === "specification" && (
                  <div className="bg-accent/5 p-8 rounded-3xl border border-border/50">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-accent">
                      <FileText className="w-6 h-6" />
                      Thông số sản phẩm
                    </h3>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: detail?.specification || '<p class="text-muted-foreground italic">Chưa có thông số kỹ thuật chi tiết.</p>' }}
                    />
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
          <div className="pt-12 border-t border-border/50">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black tracking-tight uppercase italic text-primary">Sản phẩm liên quan</h2>
              <Link to={`/category/${typeof product.category === 'string' ? product.category : product.category.name}`} className="text-primary font-bold hover:underline">Xem tất cả</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
      <MobileNavBar />
    </div>
  );
};

export default ProductDetail;
