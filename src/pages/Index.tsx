import HeroSlider from "../components/HeroSlider";
import Header from "../components/Header";
import TopBar from "../components/TopBar";
import FlashSale from "../components/FlashSale";
import BrandsSection from "../components/BrandsSection";
import ProductGrid from "../components/ProductGird";
import CartSidebar from "../components/CartSidebar";
import Footer from "../components/Footer";
import MobileNavBar from "../components/MobileNavBar";
import ChatBot from "../components/ChatBot";

function Index() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <TopBar />
      <Header />
      <main>
        <HeroSlider />
        <FlashSale />
        <BrandsSection />
        <ProductGrid />
      </main>
      <CartSidebar />
      <Footer />
      <MobileNavBar />
      <ChatBot />
    </div>
  );
}

export default Index;
