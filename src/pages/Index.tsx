import React, { Suspense, lazy } from 'react';
import HeroSlider from '../components/HeroSlider';
import FeaturedCategories from '../components/FeaturedCategories';
import ScrollReveal from '../components/ScrollReveal';
import SEO from '../components/ui/SEO';
const FlashSale = lazy(() => import('../components/FlashSale'));
const BrandsSection = lazy(() => import('../components/BrandsSection'));
const ProductGrid = lazy(() => import('../components/ProductGird'));
const NewArrivals = lazy(() => import('../components/NewArrivals'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const PromoBanner = lazy(() => import('../components/PromoBanner'));
const SuggestedForYou = lazy(() => import('../components/SuggestedForYou'));
const RecentlyViewed = lazy(() => import('../components/RecentlyViewed'));

const SectionSkeleton = () => <div className="min-h-[220px]" aria-hidden="true" />;

const Index: React.FC = () => {
  return (
    <>
      <SEO 
        title="Trang chủ" 
        description="Chào mừng bạn đến với Bông Cosmetic - Hệ thống mỹ phẩm chính hãng hàng đầu. Khám phá các dòng sản phẩm chăm sóc da, makeup và nước hoa cao cấp."
        includeWebsiteSchema
        breadcrumbs={[{ name: "Trang chủ", url: "/" }]}
      />
      <main>
        <HeroSlider />
        <FeaturedCategories />
        <Suspense fallback={<SectionSkeleton />}>
          <ScrollReveal>
            <FlashSale />
          </ScrollReveal>
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <ScrollReveal>
            <BrandsSection />
          </ScrollReveal>
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <SuggestedForYou />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <ScrollReveal>
            <ProductGrid />
          </ScrollReveal>
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <NewArrivals />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <RecentlyViewed />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <PromoBanner />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Testimonials />
        </Suspense>
      </main>
    </>
  );
};

export default Index;
