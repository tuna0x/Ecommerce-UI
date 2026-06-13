import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { BannerService } from '../service/bannerService';
import type { IBanner } from '../types/banner.type';

const HeroSlider: React.FC = () => {
  const [slides, setSlides] = useState<IBanner[]>([]);
  const [current, setCurrent] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);

    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await BannerService.getAll(0, 100);
        if (res.data?.result) {
          const activeHeroBanners = res.data.result
            .filter((banner) => banner.isActive && banner.position === 'hero')
            .sort((a, b) => a.order - b.order);
          setSlides(activeHeroBanners);
        }
      } catch (error) {
        console.error('Failed to fetch banners', error);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || isMobileViewport) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isMobileViewport, slides.length]);

  const currentSlide = slides[current];
  const shouldAnimateHero = !isMobileViewport;
  const hasContent = !!(
    (currentSlide?.title && currentSlide.title.trim() !== '') ||
    (currentSlide?.subtitle && currentSlide.subtitle.trim() !== '') ||
    (currentSlide?.description && currentSlide.description.trim() !== '')
  );

  const goToSlide = (index: number) => setCurrent(index);
  const goToPrev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  const goToNext = () => setCurrent((prev) => (prev + 1) % slides.length);

  if (!currentSlide) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-secondary/20">
      <div key={current} className={shouldAnimateHero ? 'animate-fade-in' : ''}>
        <div className="container mx-auto max-w-7xl px-4 md:px-0 py-4 md:py-10">
          {hasContent ? (
            <div className="flex flex-col md:flex-row items-center min-h-[320px] md:min-h-[520px] gap-5 md:gap-8">
              <div className="flex-1 text-center md:text-left space-y-4 md:space-y-5 order-2 md:order-1">
                {currentSlide.subtitle ? (
                  <span
                    className={`inline-block text-[11px] md:text-xs font-semibold text-primary bg-primary/10 px-3 py-1 md:px-4 md:py-1.5 rounded-full tracking-wide ${shouldAnimateHero ? 'animate-fade-in-up' : ''}`}
                    style={{ animationDelay: '100ms' }}
                  >
                    {currentSlide.subtitle}
                  </span>
                ) : null}

                <h2
                  className={`${shouldAnimateHero ? 'animate-fade-in-up' : ''} text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.08] text-balance`}
                  style={{ animationDelay: '180ms' }}
                >
                  {currentSlide.title?.split(' ').map((word, index) => (
                    <span
                      key={`${word}-${index}`}
                      className={index === currentSlide.title!.split(' ').length - 1 ? 'text-primary' : ''}
                    >
                      {word}{' '}
                    </span>
                  ))}
                </h2>

                {currentSlide.description ? (
                  <p
                    className={`${shouldAnimateHero ? 'animate-fade-in-up' : ''} text-sm md:text-lg max-w-sm md:max-w-md mx-auto md:mx-0 leading-relaxed text-muted-foreground`}
                    style={{ animationDelay: '260ms' }}
                  >
                    {currentSlide.description}
                  </p>
                ) : null}

                <div className={shouldAnimateHero ? 'animate-fade-in-up' : ''} style={{ animationDelay: '340ms' }}>
                  <Link
                    to={currentSlide.link || '#'}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 md:px-8 md:py-3.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] shadow-md md:shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Khám phá ngay
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div
                className={`flex-1 order-1 md:order-2 w-full ${shouldAnimateHero ? 'animate-fade-in-scale' : ''}`}
                style={{ animationDelay: '140ms' }}
              >
                <img
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  sizes="(max-width: 767px) 92vw, (max-width: 1200px) 50vw, 640px"
                  className={`w-full max-w-[320px] sm:max-w-[380px] md:max-w-xl mx-auto h-[180px] sm:h-[220px] md:h-[420px] object-contain rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl ${shouldAnimateHero ? 'animate-hero-float' : ''}`}
                />
              </div>
            </div>
          ) : (
            <div className={`w-full flex justify-center ${shouldAnimateHero ? 'animate-fade-in-scale' : ''}`}>
              <Link to={currentSlide.link || '#'} className="w-full block">
                <img
                  src={currentSlide.image}
                  alt="Banner"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  sizes="(max-width: 767px) 92vw, 1200px"
                  className={`w-full h-auto max-h-[260px] md:max-h-[520px] object-contain rounded-xl md:rounded-2xl shadow-lg md:shadow-xl mx-auto ${shouldAnimateHero ? 'animate-hero-float' : ''}`}
                />
              </Link>
            </div>
          )}
        </div>
      </div>

      {slides.length > 1 && !isMobileViewport ? (
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
      ) : null}

      {slides.length > 1 && !isMobileViewport ? (
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
      ) : null}
    </section>
  );
};

export default HeroSlider;
