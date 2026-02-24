import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { products } from "../data/products";
import ProductCard from "./ProductCard";

const FlashSale: React.FC = () => {
  const flashSaleProducts = useMemo(
    () => products.filter((p) => p.isFlashSale),
    [],
  );

  // Countdown timer - ends in 6 hours from now
  const [timeLeft, setTimeLeft] = useState({
    hours: 6,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const totalSeconds =
          prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1;
        if (totalSeconds <= 0) {
          return { hours: 6, minutes: 0, seconds: 0 }; // Reset
        }
        return {
          hours: Math.floor(totalSeconds / 3600),
          minutes: Math.floor((totalSeconds % 3600) / 60),
          seconds: totalSeconds % 60,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newPosition =
        direction === "left"
          ? scrollPosition - scrollAmount
          : scrollPosition + scrollAmount;
      scrollRef.current.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    }
  };

  return (
    <section className="py-8 md:py-12 bg-gradient-to-r from-primary/5 via-background to-accent/5">
      <div className="container mx-auto">
        {/* Header */}
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
              <h2 className="text-2xl md:text-3xl font-bold">Flash Sale</h2>
              <p className="text-sm text-muted-foreground">
                Giảm sốc - Số lượng có hạn
              </p>
            </div>
          </div>

          {/* Countdown */}
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

        {/* Products Carousel */}
        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-background shadow-lg rounded-full hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-1"
          >
            {flashSaleProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-[200px] md:w-[240px]"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
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
        {value.toString().padStart(2, "0")}
      </span>
    </div>
    <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
  </div>
);

export default FlashSale;
