import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BannerService } from "../service/bannerService";
import type { IBanner } from "../types/banner.type";
import { Skeleton } from "./ui/skeleton";

const DEFAULT_SUBTITLE = "Khám phá ngay";
const DEFAULT_DESCRIPTION = "Nâng tầm vẻ đẹp tự nhiên của bạn với bộ sưu tập mỹ phẩm cao cấp và quy trình chăm sóc da chuyên sâu.";

const HeroSlider: React.FC = () => {
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [current, setCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHeroBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await BannerService.getAll(0, 10, undefined, "order,asc");
      if (res.data) {
        // Filter hero banners - case insensitive to avoid missing data
        const heroBanners = res.data.result.filter((b) => 
          b.position && b.position.toLowerCase() === "hero" && b.isActive
        );
        setBanners(heroBanners);
      }
    } catch (error) {
      console.error("Failed to fetch banners", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeroBanners();
  }, [fetchHeroBanners]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  const goToSlide = (index: number) => {
    setCurrent(index);
  };

  const goToPrev = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  if (isLoading) {
    return (
      <section className="relative overflow-hidden bg-muted/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center min-h-[400px] md:min-h-[500px] py-8 md:py-0 gap-8">
            <div className="flex-1 space-y-6">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-16 w-full max-w-lg" />
              <Skeleton className="h-24 w-full max-w-sm" />
              <Skeleton className="h-12 w-40" />
            </div>
            <div className="flex-1">
              <Skeleton className="w-full max-w-md aspect-square md:aspect-auto h-[250px] md:h-[400px] rounded-2xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (banners.length === 0) return null;

  const currentBanner = banners[current];
  const bgGradients = [
    "bg-gradient-to-r from-pink-50 to-rose-100",
    "bg-gradient-to-r from-teal-50 to-cyan-100",
    "bg-gradient-to-r from-purple-50 to-pink-100",
  ];

  return (
    <section className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={bgGradients[current % bgGradients.length]}
        >
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-center min-h-[400px] md:min-h-[500px] py-8 md:py-0">
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex-1 text-center md:text-left space-y-4 md:space-y-6 order-2 md:order-1"
              >
                <span className="inline-block text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full">
                  {currentBanner.subtitle || DEFAULT_SUBTITLE}
                </span>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                  {currentBanner.title}
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto md:mx-0">
                  {currentBanner.description || DEFAULT_DESCRIPTION}
                </p>
                <a 
                  href={currentBanner.link || "#"} 
                  className="btn-primary inline-flex items-center justify-center"
                >
                  Mua ngay
                </a>
              </motion.div>

              {/* Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex-1 order-1 md:order-2 mb-6 md:mb-0"
              >
                <img
                  src={currentBanner.image}
                  alt={currentBanner.title}
                  className="w-full max-w-md mx-auto h-[250px] md:h-[400px] object-cover rounded-2xl shadow-2xl"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background rounded-full shadow-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background rounded-full shadow-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                current === index
                  ? "bg-primary w-6"
                  : "bg-foreground/30 hover:bg-foreground/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSlider;
