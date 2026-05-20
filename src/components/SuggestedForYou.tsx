import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ProductService } from '../service/productService';
import { usePersonalization } from '../context/PersonalizationContext';
import ProductCard from './ProductCard';
import ScrollReveal from './ScrollReveal';
import type { IProduct } from '../types/product.type';
import { Skeleton } from './ui/skeleton';
import { Link } from 'react-router-dom';

const SuggestedForYou: React.FC = () => {
    const { preferredCategories } = usePersonalization();
    const [suggestedProducts, setSuggestedProducts] = useState<IProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState('Gợi Ý Dành Riêng Cho Bạn');

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                setIsLoading(true);

                // Logic: Find top category from preferences
                const sortedCategories = Object.entries(preferredCategories)
                    .sort(([, a], [, b]) => b - a);

                let filter: string | undefined = undefined;
                if (sortedCategories.length > 0) {
                    const topCategoryId = sortedCategories[0][0];
                    filter = `category.id:${topCategoryId}`;
                    setTitle('Khám Phá Thêm Sở Thích Của Bạn');
                } else {
                    // Fallback to highest rated if no history
                    setTitle('Gợi Ý Cho Bạn');
                }

                // Fetch products based on preference or fallback to top rated
                const response = await ProductService.getAll(
                    0,
                    4,
                    undefined,
                    filter ? "createdAt,desc" : "averageRating,desc",
                    filter,
                    undefined,
                    true
                );

                if (response && response.data) {
                    setSuggestedProducts(response.data.result);
                }
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [preferredCategories]);

    if (!isLoading && suggestedProducts.length === 0) return null;

    return (
        <section className="py-16 md:py-24 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
                    <ScrollReveal>
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-2 text-primary font-semibold text-[10px] tracking-[0.2em] uppercase">
                                <Sparkles className="w-3.5 h-3.5 fill-current" />
                                Dành riêng cho bạn
                            </span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.2]">
                                {title}
                            </h2>
                            <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed">
                                Dựa trên những gì bạn đã quan tâm, chúng tôi nghĩ bạn sẽ thích những sản phẩm tuyệt vời này.
                            </p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.2}>
                        <Link
                            to="/shop"
                            className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                            Xem tất cả cửa hàng
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </ScrollReveal>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="space-y-4">
                                <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))
                    ) : (
                        suggestedProducts.map((product, index) => (
                            <ScrollReveal key={product.id} delay={index * 0.1}>
                                <ProductCard product={product} />
                            </ScrollReveal>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default SuggestedForYou;
