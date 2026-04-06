import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileNavBar from '../components/MobileNavBar';
import ProductCard from '../components/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ProductService } from '../service/productService';
import type { IProduct } from '../types/product.type';

const FlashSalePage: React.FC = () => {
    const [flashSaleProducts, setFlashSaleProducts] = useState<IProduct[]>([]);

    useEffect(() => {
        const fetchFlashSales = async () => {
            try {
                const res = await ProductService.getFlashSaleProducts(0, 100);
                if (res.data?.result) {
                    setFlashSaleProducts(res.data.result);
                }
            } catch (error) {
                console.error("Failed to fetch flash sale products", error);
            }
        };
        fetchFlashSales();
    }, []);

    const [sortBy, setSortBy] = useState('discount');
    const [timeLeft, setTimeLeft] = useState({ hours: 6, minutes: 0, seconds: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                const totalSeconds = prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1;
                if (totalSeconds <= 0) return { hours: 6, minutes: 0, seconds: 0 };
                return {
                    hours: Math.floor(totalSeconds / 3600),
                    minutes: Math.floor((totalSeconds % 3600) / 60),
                    seconds: totalSeconds % 60,
                };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const sortedProducts = useMemo(() => {
        const sorted = [...flashSaleProducts];
        switch (sortBy) {
            case 'discount': return sorted.sort((a, b) => ((b.originalPrice - b.finalPrice) || 0) - ((a.originalPrice - a.finalPrice) || 0));
            case 'price-asc': return sorted.sort((a, b) => a.finalPrice - b.finalPrice);
            case 'price-desc': return sorted.sort((a, b) => b.finalPrice - a.finalPrice);
            case 'rating': return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
            default: return sorted;
        }
    }, [flashSaleProducts, sortBy]);

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            <Header />
            <main>
                {/* Banner */}
                <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 py-8 md:py-12">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="p-3 bg-primary rounded-xl"
                                >
                                    <Zap className="w-7 h-7 text-primary-foreground" />
                                </motion.div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold">Flash Sale</h1>
                                    <p className="text-muted-foreground mt-1">Giảm sốc - Số lượng có hạn</p>
                                </div>
                            </div>

                            {/* Countdown */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-muted-foreground">Kết thúc trong:</span>
                                <div className="flex gap-1.5">
                                    <TimeBox value={timeLeft.hours} label="Giờ" />
                                    <span className="text-2xl font-bold text-primary self-start mt-2">:</span>
                                    <TimeBox value={timeLeft.minutes} label="Phút" />
                                    <span className="text-2xl font-bold text-primary self-start mt-2">:</span>
                                    <TimeBox value={timeLeft.seconds} label="Giây" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Products */}
                <section className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-muted-foreground">
                            <span className="font-semibold text-foreground">{flashSaleProducts.length}</span> sản phẩm đang giảm giá
                        </p>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="discount">Giảm nhiều nhất</SelectItem>
                                <SelectItem value="price-asc">Giá thấp → cao</SelectItem>
                                <SelectItem value="price-desc">Giá cao → thấp</SelectItem>
                                <SelectItem value="rating">Đánh giá cao</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {sortedProducts.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </div>

                    {flashSaleProducts.length === 0 && (
                        <div className="text-center py-16">
                            <Zap className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground">Hiện chưa có sản phẩm Flash Sale nào</p>
                        </div>
                    )}
                </section>
            </main>
            <Footer />
            <MobileNavBar />
        </div>
    );
};

const TimeBox: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center">
        <div className="bg-foreground text-background px-3 py-2 rounded-lg min-w-[48px] text-center">
            <span className="text-lg md:text-xl font-bold">{value.toString().padStart(2, '0')}</span>
        </div>
        <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
    </div>
);

export default FlashSalePage;
