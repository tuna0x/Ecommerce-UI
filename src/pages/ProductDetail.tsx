import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Heart,
  Share2,
  Star,
  ShoppingBag,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  Check,
} from "lucide-react";
import { products } from "../data/products";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartSidebar from "../components/CartSidebar";
import MobileNavBar from "../components/MobileNavBar";

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === Number(id));
  const { addToCart } = useCart();
  //   const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "description" | "usage" | "reviews"
  >("description");

  //   const inWishlist = product ? isInWishlist(product.id) : false;

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Không tìm thấy sản phẩm</p>
        <Link to="/" className="text-primary ml-2">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const images = [product.image, product.hoverImage];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  //   const handleWishlistToggle = () => {
  //     if (inWishlist) {
  //       removeFromWishlist(product.id);
  //     } else {
  //       addToWishlist(product);
  //     }
  //   };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <CartSidebar />

      <main className="container mx-auto py-4 md:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Trang chủ
          </Link>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Product Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Images */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square bg-secondary/30 rounded-2xl overflow-hidden"
            >
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="flex gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index
                      ? "border-primary"
                      : "border-transparent"
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
          <div className="space-y-6">
            <div>
              <p className="text-primary font-medium mb-1">{product.brand}</p>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{product.rating}</span>
                </div>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">
                  {product.reviewCount} đánh giá
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">Đã bán 1.2k</span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="sale-badge">-{product.discount}%</span>
                  </>
                )}
              </div>
            </div>

            {/* Volume/Variant */}
            {product.volume && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Dung tích: {product.volume}
                </p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border-2 border-primary text-primary rounded-lg text-sm font-medium">
                    {product.volume}
                  </button>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium mb-2">Số lượng</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-secondary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {product.stock && (
                  <span className="text-sm text-muted-foreground">
                    Còn {product.stock} sản phẩm
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                Thêm vào giỏ
              </button>
              {/* <button
                onClick={handleWishlistToggle}
                className={`p-4 border rounded-lg transition-colors ${
                  inWishlist
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border hover:bg-secondary'
                }`}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-primary' : ''}`} />
              </button> */}
              <button className="p-4 border border-border rounded-lg hover:bg-secondary transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-5 h-5 text-accent" />
                <span>Freeship 500K</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-5 h-5 text-accent" />
                <span>Chính hãng</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RotateCcw className="w-5 h-5 text-accent" />
                <span>Đổi trả 30 ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-12">
          <div className="flex border-b border-border mb-6">
            {(["description", "usage", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "description" && "Mô tả sản phẩm"}
                {tab === "usage" && "Hướng dẫn sử dụng"}
                {tab === "reviews" && `Đánh giá (${product.reviewCount})`}
              </button>
            ))}
          </div>

          <div className="max-w-3xl">
            {activeTab === "description" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-sm"
              >
                <p className="text-muted-foreground leading-relaxed">
                  {product.name} từ thương hiệu {product.brand} là sản phẩm chăm
                  sóc da cao cấp, được nghiên cứu và phát triển với công nghệ
                  tiên tiến nhất. Sản phẩm phù hợp cho{" "}
                  {product.skinType?.join(", ") || "mọi loại da"}, giúp{" "}
                  {product.concern?.join(", ").toLowerCase()}.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent" />
                    Thành phần lành tính, an toàn cho da
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent" />
                    Không chứa paraben, không cồn
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent" />
                    Đã được kiểm nghiệm da liễu
                  </li>
                </ul>
              </motion.div>
            )}

            {activeTab === "usage" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-sm"
              >
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                  <li>Làm sạch da mặt với sữa rửa mặt</li>
                  <li>Cân bằng da với toner</li>
                  <li>Lấy một lượng sản phẩm vừa đủ ra tay</li>
                  <li>
                    Thoa đều lên mặt và cổ theo hướng từ trong ra ngoài, từ dưới
                    lên trên
                  </li>
                  <li>Massage nhẹ nhàng để sản phẩm thẩm thấu</li>
                  <li>Sử dụng đều đặn sáng và tối để đạt hiệu quả tốt nhất</li>
                </ol>
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {[1, 2, 3].map((review) => (
                  <div key={review} className="p-4 bg-secondary/30 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium">N</span>
                      </div>
                      <div>
                        <p className="font-medium">Nguyễn Thị A</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-3 h-3 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">
                        2 ngày trước
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sản phẩm rất tốt, da mình cải thiện rõ rệt sau 2 tuần sử
                      dụng. Đóng gói cẩn thận, giao hàng nhanh. Sẽ mua lại!
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
