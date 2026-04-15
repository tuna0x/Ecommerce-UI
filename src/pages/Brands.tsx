import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Loader2, ChevronRight, Hash } from "lucide-react";
import { BrandService } from "../service/brandService";
import type { IBrand } from "../types/brand.type";
import { Input } from "../components/ui/input";
import SEO from "../components/ui/SEO";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const Brands = () => {
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const res = await BrandService.getAll(0, 500, undefined, "name,asc");
        if (res.data?.result) {
          setBrands(res.data.result);
        }
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const filteredBrands = useMemo(() => {
    return brands.filter(brand => 
      brand.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [brands, searchQuery]);

  const groupedBrands = useMemo(() => {
    const groups: { [key: string]: IBrand[] } = {};
    
    filteredBrands.forEach(brand => {
      const firstLetter = brand.name.charAt(0).toUpperCase();
      const key = /^[A-Z]$/.test(firstLetter) ? firstLetter : "#";
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(brand);
    });
    
    return groups;
  }, [filteredBrands]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(`brand-group-${id}`);
    if (element) {
      const offset = 100; // Account for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Thương hiệu mỹ phẩm chính hãng"
        description="Khám phá hơn 100+ thương hiệu mỹ phẩm chính hãng tại Bông Cosmetic. Từ sản phẩm làm đẹp cao cấp đến dược mỹ phẩm an toàn."
        url="/brands"
      />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h1 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              THẾ GIỚI THƯƠNG HIỆU
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Bông Cosmetic tự hào là đối tác chiến lược của hàng trăm thương hiệu mỹ phẩm hàng đầu thế giới.
            </p>
            
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                type="text"
                placeholder="Tìm nhanh thương hiệu..."
                className="pl-10 h-12 rounded-full border-primary/20 focus:border-primary shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
        
        {/* Background shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Alphabet Sidebar (Sticky) */}
          <aside className="lg:w-16 flex lg:flex-col items-center gap-1 sticky top-20 z-30 bg-background/80 backdrop-blur-sm lg:bg-transparent p-2 lg:p-0 rounded-full border lg:border-none border-border">
            <button 
              onClick={() => scrollToSection("#")}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold hover:bg-primary hover:text-white transition-all"
            >
              <Hash className="w-4 h-4" />
            </button>
            {ALPHABET.map(letter => (
              <button
                key={letter}
                disabled={!groupedBrands[letter]}
                onClick={() => scrollToSection(letter)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  groupedBrands[letter] 
                    ? "text-foreground hover:bg-primary hover:text-white cursor-pointer" 
                    : "text-muted-foreground/30 cursor-not-allowed"
                }`}
              >
                {letter}
              </button>
            ))}
          </aside>

          {/* Directory Content */}
          <div className="flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50 mb-4" />
                <p className="text-muted-foreground animate-pulse">Đang nạp dữ liệu thương hiệu...</p>
              </div>
            ) : filteredBrands.length === 0 ? (
              <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-dashed border-border">
                <p className="text-muted-foreground">Không tìm thấy thương hiệu nào khớp với "{searchQuery}"</p>
                <button onClick={() => setSearchQuery("")} className="text-primary font-bold mt-2 hover:underline">Xem tất cả</button>
              </div>
            ) : (
              <div className="space-y-12">
                {Object.keys(groupedBrands).sort((a, b) => a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)).map(letter => (
                  <div key={letter} id={`brand-group-${letter}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4 mb-6 sticky top-20 bg-background py-2 z-20">
                      <h2 className="text-3xl font-black text-primary">{letter}</h2>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {groupedBrands[letter].map(brand => (
                        <motion.div
                          key={brand.id}
                          whileHover={{ y: -5 }}
                          className="group"
                        >
                          <Link to={`/category/all?brand=${encodeURIComponent(brand.name)}`}>
                            <div className="h-full p-6 bg-background rounded-2xl border border-border group-hover:border-primary/50 group-hover:shadow-xl group-hover:shadow-primary/5 transition-all duration-300 flex flex-col items-center text-center">
                              <div className="w-20 h-20 mb-4 rounded-xl bg-secondary/30 flex items-center justify-center overflow-hidden transition-colors group-hover:bg-primary/5 p-2">
                                {brand.image ? (
                                  <img src={brand.image} alt={brand.name} className="w-full h-full object-contain transition-all" />
                                ) : (
                                  <span className="text-2xl font-black text-muted-foreground/30 group-hover:text-primary/30">{brand.name.charAt(0)}</span>
                                )}
                              </div>
                              <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">{brand.name}</h3>
                              <span className="text-[10px] text-primary/70 group-hover:text-primary transition-colors uppercase tracking-widest font-black mt-2">KHÁM PHÁ NGAY</span>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Decoration */}
      <section className="py-20 bg-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Trở thành đối tác của chúng tôi?</h2>
          <p className="text-muted-foreground mb-8 text-sm max-w-md mx-auto">Nếu bạn là nhà cung cấp hoặc thương hiệu mỹ phẩm muốn hợp tác với Bông Cosmetic, hãy liên hệ ngay.</p>
          <Link to="/contact">
            <button className="h-12 px-8 bg-foreground text-background rounded-full font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2 mx-auto">
              LIÊN HỆ HỢP TÁC
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Brands;
