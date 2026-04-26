import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import { ProductService } from '../service/productService';
import { flashSaleService, type FlashSaleCampaign } from '../service/flashSaleService';
import type { IProduct } from '../types/product.type';
import { Button } from './ui/button';
import { useSocket } from '../context/SocketContext';

const FlashSale: React.FC = () => {
  const { stompClient, isConnected } = useSocket();
  const [isLoading, setIsLoading] = useState(true);
  const [flashSaleProducts, setFlashSaleProducts] = useState<IProduct[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<FlashSaleCampaign | null>(null);

  const [lastFetchTime, setLastFetchTime] = useState(0);
  const fetchFlashSales = useCallback(async (isSilent = false) => {
    // Simple throttle: don't refetch more than once every 10 seconds unless forced
    const now = Date.now();
    if (isSilent && now - lastFetchTime < 10000) return;

    try {
      if (flashSaleProducts.length === 0) setIsLoading(true);
      // Fetch campaign info
      const campaign = await flashSaleService.getActiveCampaign();
      setActiveCampaign(campaign);

      // Fetch products
      const res = await ProductService.getFlashSaleProducts(0, 10);
      if (res.data?.result) {
        setFlashSaleProducts(res.data.result);
        setLastFetchTime(now);
      }
    } catch (error) {
      console.error("Failed to fetch flash sale products", error);
    } finally {
      setIsLoading(false);
    }
  }, [lastFetchTime]);

  useEffect(() => {
    fetchFlashSales();

    // Polling every 30 seconds for real-time updates
    const interval = setInterval(() => fetchFlashSales(true), 30000);
    return () => clearInterval(interval);
  }, [fetchFlashSales]);

  // Real-time update subscription with 2s debounce to prevent Thundering Herd problem
  useEffect(() => {
    if (isConnected && stompClient) {
      const subscription = stompClient.subscribe('/topic/product-updates', (message) => {
        console.log("WebSocket message received in FlashSale:", message.body);
        // Using a random delay between 0-2s to jitter the requests from multiple clients
        const jitter = Math.random() * 2000;
        setTimeout(() => {
          fetchFlashSales(true);
        }, jitter);
      });
      return () => subscription.unsubscribe();
    }
  }, [isConnected, stompClient, fetchFlashSales]);

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (flashSaleProducts.length === 0) return;

    // Use endAt from the campaign if available
    const endTimeStr = activeCampaign?.endAt || (flashSaleProducts[0]?.flashSale?.endAt);
    if (!endTimeStr) return;

    const endTime = new Date(endTimeStr).getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSaleProducts, activeCampaign?.endAt]);

  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newPosition =
        direction === 'left'
          ? scrollPosition - scrollAmount
          : scrollPosition + scrollAmount;
      scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  // If not loading and no campaign/products found, show premium Empty State
  if (!isLoading && (!activeCampaign || flashSaleProducts.length === 0)) {
    return (
      <section className="py-12 md:py-20 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2rem] border border-pink-100 bg-white/50 backdrop-blur-xl p-8 md:p-12 text-center shadow-2xl shadow-pink-500/5"
          >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-pink-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="mb-6 p-5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg shadow-pink-200"
              >
                <Zap className="w-10 h-10 md:w-12 md:h-12 text-white fill-white/20" />
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                Khung giờ Flash Sale đã kết thúc
              </h2>
              <p className="max-w-lg text-slate-500 text-lg leading-relaxed mb-8">
                Hẹn gặp lại bạn vào khung giờ tiếp theo với danh sách sản phẩm giảm giá cực khủng. Đừng bỏ lỡ nhé!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button
                  className="bg-pink-600 hover:bg-pink-700 text-white px-8 h-12 rounded-full font-bold shadow-lg shadow-pink-200 transition-all hover:scale-105 active:scale-95"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Tiếp tục mua sắm
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-8 h-12 border-slate-200 font-bold hover:bg-slate-50 transition-all"
                  onClick={() => window.location.href = '/category/all'}
                >
                  Xem tất cả sản phẩm
                </Button>
              </div>

              <div className="mt-12 flex items-center gap-6 grayscale opacity-50">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-1 w-12 bg-slate-300 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Chất lượng</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="h-1 w-12 bg-slate-300 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giá sốc</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="h-1 w-12 bg-slate-300 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Uy tín</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12 bg-gradient-to-r from-primary/5 via-background to-accent/5">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="p-2 bg-primary rounded-lg"
            >
              <Zap className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
                {activeCampaign?.name || "Flash Sale"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeCampaign?.description || "Giảm sốc - Số lượng có hạn"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Kết thúc trong:
            </span>
            <div className="flex gap-1">
              <TimeBox value={timeLeft.hours} label="Giờ" />
              <span className="text-xl font-bold text-primary">:</span>
              <TimeBox value={timeLeft.minutes} label="Phút" />
              <span className="text-xl font-bold text-primary">:</span>
              <TimeBox value={timeLeft.seconds} label="Giây" />
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-background shadow-lg rounded-full hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-1"
          >
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[200px] md:w-[240px]">
                  <ProductCardSkeleton />
                </div>
              ))
              : flashSaleProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 w-[200px] md:w-[240px]"
                >
                  <ProductCard product={product} showFlashSale />
                </motion.div>
              ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-background shadow-lg rounded-full hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

const TimeBox: React.FC<{ value: number; label: string }> = ({
  value,
  label,
}) => (
  <div className="flex flex-col items-center">
    <div className="bg-foreground text-background px-3 py-2 rounded-lg min-w-[48px] text-center">
      <span className="text-lg md:text-xl font-bold">
        {value.toString().padStart(2, '0')}
      </span>
    </div>
    <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
  </div>
);

export default FlashSale;
