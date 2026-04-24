import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ProductService } from '../service/productService';
import ProductCard from './ProductCard';
import ScrollReveal from './ScrollReveal';
import type { IProduct } from '../types/product.type';
import { Skeleton } from './ui/skeleton';
import { useSocket } from '../context/SocketContext';
import { useCallback } from 'react';

const NewArrivals: React.FC = () => {
    const { stompClient, isConnected } = useSocket();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [newProducts, setNewProducts] = useState<IProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNewArrivals = useCallback(async () => {
        try {
            setIsLoading(true);
            // Fetch first page, 8 products, sorted by createdAt descending
            const response = await ProductService.getAll(0, 8, undefined, "createdAt,desc", undefined, undefined, true);
            if (response && response.data) {
                setNewProducts(response.data.result);
            }
        } catch (error) {
            console.error("Error fetching new arrivals:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNewArrivals();
    }, [fetchNewArrivals]);

    // Real-time update subscription
    useEffect(() => {
        if (isConnected && stompClient) {
            const subscription = stompClient.subscribe('/topic/product-updates', (message) => {
                console.log("WebSocket message received in NewArrivals:", message.body);
                // Delay 1s to ensure DB consistency
                setTimeout(() => {
                    fetchNewArrivals();
                }, 1000);
            });
            return () => subscription.unsubscribe();
        }
    }, [isConnected, stompClient, fetchNewArrivals]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 280;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <section className="py-16 md:py-20 bg-secondary/30">
            <div className="container mx-auto max-w-7xl">
                <ScrollReveal>
                    <div className="text-center mb-10 md:mb-14 relative">
                        <span className="inline-flex items-center gap-1.5 text-primary font-semibold text-[10px] tracking-[0.2em] uppercase mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            Mới nhất
                        </span>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                            Hàng Mới Về
                        </h2>
                        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto leading-relaxed">
                            Khám phá những sản phẩm mới nhất vừa cập bến, được chọn lọc kỹ lưỡng.
                        </p>

                        {/* Navigation Arrows */}
                        <div className="hidden md:flex items-center gap-2 absolute right-0 bottom-0">
                            <button
                                onClick={() => scroll('left')}
                                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Horizontal Scroll Carousel */}
                <ScrollReveal delay={0.15}>
                    <div
                        ref={scrollRef}
                        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory -mx-4 px-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] snap-start"
                                >
                                    <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                                </div>
                            ))
                        ) : newProducts.length > 0 ? (
                            newProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] snap-start"
                                >
                                    <ProductCard product={product} />
                                </div>
                            ))
                        ) : (
                            <div className="w-full text-center py-10 text-muted-foreground italic">
                                Chưa có sản phẩm mới nào
                            </div>
                        )}
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
};

export default NewArrivals;
