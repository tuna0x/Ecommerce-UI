import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

import ProductCard from '../components/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ProductService } from '../service/productService';
import { flashSaleService, type FlashSaleCampaign } from '../service/flashSaleService';
import type { IProduct } from '../types/product.type';

const FlashSalePage: React.FC = () => {
    const [flashSaleProducts, setFlashSaleProducts] = useState<IProduct[]>([]);
    const [activeCampaign, setActiveCampaign] = useState<FlashSaleCampaign | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [campaignRes, productsRes] = await Promise.all([
                    flashSaleService.getActiveCampaign(),
                    ProductService.getFlashSaleProducts(0, 100)
                ]);

                if (campaignRes) {
                    setActiveCampaign(campaignRes);
                }

                if (productsRes.data?.result) {
                    setFlashSaleProducts(productsRes.data.result);
                }
            } catch (error) {
                console.error("Failed to fetch flash sale data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const [sortBy, setSortBy] = useState('discount');
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    const isUpcoming = useMemo(() => {
        return activeCampaign && new Date(activeCampaign.startAt).getTime() > new Date().getTime();
    }, [activeCampaign]);

    useEffect(() => {
        if (!activeCampaign) return;

        const calculateTimeLeft = () => {
            const targetTime = isUpcoming ? activeCampaign.startAt : activeCampaign.endAt;
            const end = new Date(targetTime).getTime();
            const now = new Date().getTime();
            const difference = end - now;

            if (difference <= 0) {
                return { hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                hours: Math.floor((difference / (1000 * 60 * 60))),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());

        return () => clearInterval(timer);
    }, [activeCampaign, isUpcoming]);

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
                                    <h1 className="text-3xl md:text-4xl font-bold">
                                        {isUpcoming ? "Sắp diễn ra Flash Sale" : (activeCampaign ? activeCampaign.name : "Flash Sale")}
                                    </h1>
                                    <p className="text-muted-foreground mt-1 text-lg">
                                        {isUpcoming
                                            ? `Đừng bỏ lỡ: "${activeCampaign?.name}" sắp bắt đầu rồi!`
                                            : (activeCampaign ? activeCampaign.description : "Giảm sốc - Số lượng có hạn")}
                                    </p>
                                </div>
                            </div>

                            {/* Countdown */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-muted-foreground">
                                    {isUpcoming ? "Bắt đầu sau:" : "Kết thúc trong:"}
                                </span>
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

                    {!loading && flashSaleProducts.length === 0 && (
                        <div className="text-center py-16">
                            <Zap className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground">
                                {isUpcoming
                                    ? "Sản phẩm sẽ xuất hiện ngay khi chương trình bắt đầu. Hãy quay lại sau nhé!"
                                    : (activeCampaign ? "Sản phẩm đang được cập nhật..." : "Hiện chưa có chiến dịch Flash Sale nào")}
                            </p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </section>
            </main>
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
