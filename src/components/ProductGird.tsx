import React, { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { ProductService } from "../service/productService";
import type { IProduct } from "../types/product.type";
import { toast } from "sonner";
import { useSocket } from "../context/SocketContext";
const ProductGrid: React.FC = () => {
  const { stompClient, isConnected } = useSocket();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const lastFetchTimeRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const fetchProducts = useCallback(async (isSilent = false) => {
    // Simple throttle: don't refetch more than once every 10 seconds unless forced
    const now = Date.now();
    if (isSilent && now - lastFetchTimeRef.current < 10000) return;

    try {
      if (isInitialLoadRef.current) {
        setIsLoading(true);
        isInitialLoadRef.current = false;
      }
      const response = await ProductService.getAll(0, 10, undefined, "soldCount,desc", undefined, undefined, true);
      if (response && response.data) {
        setProducts(response.data.result);
        lastFetchTimeRef.current = now;
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      if (!isSilent) toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Real-time update subscription with jitter to prevent Thundering Herd
  useEffect(() => {
    if (isConnected && stompClient) {
      const subscription = stompClient.subscribe('/topic/product-updates', (message) => {
        console.log("WebSocket message received in ProductGrid:", message.body);
        // Using a random delay to jitter the requests
        const jitter = Math.random() * 2000;
        setTimeout(() => {
          fetchProducts(true);
        }, jitter);
      });
      return () => subscription.unsubscribe();
    }
  }, [isConnected, stompClient, fetchProducts]);

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <span className="text-primary font-semibold text-[10px] tracking-[0.2em] uppercase mb-2 block">
            Featured
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 text-foreground">
            Our Best Sellers
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Handpicked products that our customers love. Premium quality, timeless
            design.
          </p>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {[...Array(10)].map((_, index) => (
              <div
                key={index}
                className="aspect-[3/4] bg-secondary/10 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Top 3 rank badge */}
                {index < 3 && (
                  <span className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center text-[10px] font-bold text-muted-foreground/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/10 rounded-xl">
            <p className="text-muted-foreground uppercase tracking-widest text-sm">
              Chưa có sản phẩm nào
            </p>
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-10 md:mt-14">
          <Link
            to="/category/all"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
          >
            Xem tất cả sản phẩm
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
