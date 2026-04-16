import React from 'react';
import { usePersonalization } from '../context/PersonalizationContext';
import ProductCard from './ProductCard';
import ScrollReveal from './ScrollReveal';
import { History } from 'lucide-react';

const RecentlyViewed: React.FC = () => {
    const { recentlyViewed } = usePersonalization();

    if (recentlyViewed.length === 0) return null;

    return (
        <section className="py-12 md:py-16 bg-secondary/20">
            <div className="container mx-auto px-4">
                <ScrollReveal>
                    <div className="flex items-center gap-3 mb-8 md:mb-10">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <History className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-foreground">
                                Sản phẩm bạn đã xem
                            </h2>
                            <p className="text-xs md:text-sm text-muted-foreground">
                                Quay lại xem nhanh các sản phẩm bạn đã quan tâm
                            </p>
                        </div>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                    {recentlyViewed.slice(0, 5).map((product, index) => (
                        <ScrollReveal key={product.id} delay={index * 0.05}>
                            <ProductCard product={product} />
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RecentlyViewed;
