import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    id: 1,
    title: "SALE MÙA HÈ",
    subtitle: "Giảm đến 50%",
    description: "Chăm sóc da mùa hè với các sản phẩm chống nắng hàng đầu",
    cta: "Mua ngay",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80",
    bgColor: "bg-gradient-to-r from-pink-50 to-rose-100",
  },
  {
    id: 2,
    title: "SKINCARE ROUTINE",
    subtitle: "Combo tiết kiệm",
    description: "Bộ chăm sóc da hoàn hảo cho làn da rạng rỡ",
    cta: "Khám phá",
    image:
      "https://pub-26e6aa63ed7942ecb7e9dbc72f09f164.r2.dev/heroes/casa-lunara.webp",
    bgColor: "bg-gradient-to-r from-teal-50 to-cyan-100",
  },
  {
    id: 3,
    title: "MAKEUP COLLECTION",
    subtitle: "Bộ sưu tập mới",
    description: "Xu hướng trang điểm 2024 với các thương hiệu đình đám",
    cta: "Xem ngay",
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1200&q=80",
    bgColor: "bg-gradient-to-r from-purple-50 to-pink-100",
  },
];

const HeroSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrent(index);
  };

  const goToPrev = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`${slides[current].bgColor}`}
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
                  {slides[current].subtitle}
                </span>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                  {slides[current].title}
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto md:mx-0">
                  {slides[current].description}
                </p>
                <button className="btn-primary">{slides[current].cta}</button>
              </motion.div>

              {/* Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex-1 order-1 md:order-2 mb-6 md:mb-0"
              >
                <img
                  src={slides[current].image}
                  alt={slides[current].title}
                  className="w-full max-w-md mx-auto h-[250px] md:h-[400px] object-cover rounded-2xl shadow-2xl"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
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

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
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
    </section>
  );
};

export default HeroSlider;
