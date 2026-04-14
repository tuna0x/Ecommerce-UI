import React from 'react';
import HeroSlider from '../components/HeroSlider';
import FlashSale from '../components/FlashSale';
import FeaturedCategories from '../components/FeaturedCategories';
import BrandsSection from '../components/BrandsSection';
import ProductGrid from '../components/ProductGird';
import NewArrivals from '../components/NewArrivals';
import Testimonials from '../components/Testimonials';
import PromoBanner from '../components/PromoBanner';
import ScrollReveal from '../components/ScrollReveal';
import SEO from '../components/ui/SEO';

const Index: React.FC = () => {
  return (
    <>
      <SEO 
        title="Trang chủ" 
        description="Chào mừng bạn đến với Bông Cosmetic - Hệ thống mỹ phẩm chính hãng hàng đầu. Khám phá các dòng sản phẩm chăm sóc da, makeup và nước hoa cao cấp."
      />
      <main>
        <HeroSlider />
        <ScrollReveal>
          <FlashSale />
        </ScrollReveal>
        <FeaturedCategories />
        <ScrollReveal>
          <BrandsSection />
        </ScrollReveal>
        <ScrollReveal>
          <ProductGrid />
        </ScrollReveal>
        <NewArrivals />
        <PromoBanner />
        <Testimonials />
      </main>
    </>
  );
};

export default Index;
