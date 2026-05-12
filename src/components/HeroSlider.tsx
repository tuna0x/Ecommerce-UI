import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { BannerService } from '../service/bannerService';
import type { IBanner } from '../types/banner.type';

const HeroSlider: React.FC = () => {
  const [slides, setSlides] = useState<IBanner[]>([]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await BannerService.getAll(0, 100);
        if (res.data?.result) {
          const activeHeroBanners = res.data.result
            .filter(b => b.isActive && b.position === 'hero')
            .sort((a, b) => a.order - b.order);
          setSlides(activeHeroBanners);
        }
      } catch (error) {
        console.error("Failed to fetch banners", error);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  const currentSlide = slides[current];
  const hasContent = !!(
    (currentSlide?.title && currentSlide.title.trim() !== '') ||
    (currentSlide?.subtitle && currentSlide.subtitle.trim() !== '') ||
    (currentSlide?.description && currentSlide.description.trim() !== '')
  );

  return (
    <section className="relative overflow-hidden bg-secondary/30">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {slides.length > 0 && (
          <div className="container mx-auto max-w-7xl px-4 md:px-0 py-6 md:py-10">
            {hasContent ? (
              <div className="flex flex-col md:flex-row items-center min-h-[420px] md:min-h-[520px] py-10 md:py-0 gap-8">
                {/* Content */}
                <div className="flex-1 text-center md:text-left space-y-5 order-2 md:order-1">
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-block text-xs font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full tracking-wide"
                  >
                    {currentSlide?.subtitle}
                  </motion.span>

                  <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]"
                  >
                    {currentSlide?.title?.split(' ').map((word, i) => (
                      <span key={i} className={i === currentSlide.title.split(' ').length - 1 ? 'text-primary' : ''}>
                        {word}{' '}
                      </span>
                    ))}
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-muted-foreground text-base md:text-lg max-w-md mx-auto md:mx-0 leading-relaxed"
                  >
                    {currentSlide?.description}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65, duration: 0.5 }}
                  >
                    <Link
                      to={currentSlide?.link || '#'}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      Khám phá ngay
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                </div>

                {/* Image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="flex-1 order-1 md:order-2 w-full"
                >
                  <img
                    src={currentSlide?.image}
                    alt={currentSlide?.title}
                    className="w-full max-w-lg mx-auto h-[260px] md:h-[420px] object-cover rounded-2xl shadow-2xl"
                  />
                </motion.div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full flex justify-center"
              >
                <Link to={currentSlide?.link || '#'} className="w-full block">
                  <img
                    src={currentSlide?.image}
                    alt="Banner"
                    className="w-full h-auto max-h-[520px] object-contain rounded-2xl shadow-xl mx-auto"
                  />
                </Link>
              </motion.div>
            )}
          </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-background/70 backdrop-blur-sm hover:bg-background rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-background/70 backdrop-blur-sm hover:bg-background rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Progress Dots */}
      {slides.length > 1 && (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              current === index
                ? 'bg-primary w-8'
                : 'bg-foreground/20 w-1.5 hover:bg-foreground/40'
            }`}
          />
        ))}
      </div>
      )}
    </section>
  );
};

export default HeroSlider;
