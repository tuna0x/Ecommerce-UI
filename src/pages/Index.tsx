import React from 'react';
import TopBar from '../components/TopBar';
import Header from '../components/Header';
import HeroSlider from '../components/HeroSlider';
import FlashSale from '../components/FlashSale';
import FeaturedCategories from '../components/FeaturedCategories';
import BrandsSection from '../components/BrandsSection';
import ProductGrid from '../components/ProductGird';
import NewArrivals from '../components/NewArrivals';
import Testimonials from '../components/Testimonials';
import PromoBanner from '../components/PromoBanner';
import CartSidebar from '../components/CartSidebar';
import Footer from '../components/Footer';
import MobileNavBar from '../components/MobileNavBar';
import ChatBot from '../components/ChatBot';
import ScrollReveal from '../components/ScrollReveal';
import SEO from '../components/ui/SEO';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO 
        title="Trang chủ" 
        description="Chào mừng bạn đến với Bông Cosmetic - Hệ thống mỹ phẩm chính hãng hàng đầu. Khám phá các dòng sản phẩm chăm sóc da, makeup và nước hoa cao cấp."
      />
      <TopBar />
      <Header />
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
      <CartSidebar />
      <Footer />
      <MobileNavBar />
      <ChatBot />
    </div>
  );
};

export default Index;
