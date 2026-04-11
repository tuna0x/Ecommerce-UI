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
import CategorySlider from '../components/CategorySlider';
import ScrollReveal from '../components/ScrollReveal';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <TopBar />
      <Header />
      <main>
        <HeroSlider />
        <CategorySlider />
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
