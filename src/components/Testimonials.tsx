import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { reviewService, type IReview } from '../service/reviewService';

const mockTestimonials = [
    {
        id: 1,
        name: 'Nguyễn Thị Minh Anh',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
        rating: 5,
        text: 'Sản phẩm serum vitamin C thực sự tuyệt vời! Da mình sáng hơn rõ rệt chỉ sau 2 tuần sử dụng. Đóng gói cẩn thận, giao hàng nhanh chóng.',
        product: 'Serum Vitamin C 15%',
        verified: true,
    },
    {
        id: 2,
        name: 'Trần Thanh Hương',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
        rating: 5,
        text: 'Mình đã thử rất nhiều kem chống nắng nhưng sản phẩm của BÔNGCOSMETIC là tốt nhất. Không bết dính, không gây mụn. Sẽ mua lại nhiều lần nữa!',
        product: 'Kem Chống Nắng SPF50+',
        verified: true,
    },
    {
        id: 3,
        name: 'Lê Phương Thảo',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        rating: 5,
        text: 'Son YSL mua ở đây đảm bảo chính hãng 100%, giá lại rẻ hơn nhiều nơi khác. Dịch vụ chăm sóc khách hàng rất tốt và tận tâm.',
        product: 'Son YSL Rouge Pur Couture',
        verified: true,
    },
    {
        id: 4,
        name: 'Phạm Ngọc Hà',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
        rating: 4,
        text: 'Bộ skincare routine mình đặt rất ưng ý. Packaging đẹp, có hướng dẫn sử dụng chi tiết. BÔNGCOSMETIC là địa chỉ tin cậy cho mỹ phẩm chính hãng.',
        product: 'Combo Skincare Routine',
        verified: true,
    },
];

const Testimonials: React.FC = () => {
    const [current, setCurrent] = useState(0);
    const [testimonials, setTestimonials] = useState<any[]>(mockTestimonials);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await reviewService.getFeaturedReviews(5, 1, 10);
                if (res.data?.result && res.data.result.length > 0) {
                    const realReviews = res.data.result.map((rev: IReview) => ({
                        id: rev.id,
                        name: rev.userName,
                        avatar: rev.userImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.userName)}&background=random`,
                        rating: rev.rating,
                        text: rev.comment,
                        product: rev.productName || 'Sản phẩm tại Bông Cosmetic',
                        verified: true
                    }));
                    
                    // Mix real reviews with mock if real reviews are few
                    if (realReviews.length < 3) {
                        setTestimonials([...realReviews, ...mockTestimonials.slice(0, 4 - realReviews.length)]);
                    } else {
                        setTestimonials(realReviews);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch testimonials", error);
                // Fallback to mock data already handled in useState
            }
        };

        fetchReviews();
    }, []);

    const goToPrev = () => {
        setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const goToNext = () => {
        setCurrent((prev) => (prev + 1) % testimonials.length);
    };

    if (testimonials.length === 0) return null;

    return (
        <section className="py-16 md:py-20 bg-secondary/30">
            <div className="container mx-auto max-w-4xl">
                <ScrollReveal>
                    <div className="text-center mb-10 md:mb-14">
                        <span className="text-primary font-semibold text-[10px] tracking-[0.2em] uppercase mb-2 block">
                            Đánh giá
                        </span>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 text-foreground">
                            Khách Hàng Nói Gì
                        </h2>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                            Hàng ngàn khách hàng tin tưởng và yêu thích sản phẩm của chúng tôi
                        </p>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.15}>
                    <div className="relative min-h-[400px] flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="bg-card rounded-2xl p-8 md:p-12 shadow-sm border border-border text-center"
                            >
                                {/* Quote icon */}
                                <Quote className="w-8 h-8 text-primary/20 mx-auto mb-6" />

                                {/* Review text */}
                                <p className="text-foreground text-base md:text-lg leading-relaxed mb-8 max-w-2xl mx-auto italic">
                                    "{testimonials[current]?.text}"
                                </p>

                                {/* Stars */}
                                <div className="flex justify-center gap-1 mb-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < (testimonials[current]?.rating || 5)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-muted-foreground/30'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Avatar & Name */}
                                <div className="flex items-center justify-center gap-3">
                                    <img
                                        src={testimonials[current]?.avatar}
                                        alt={testimonials[current]?.name}
                                        className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/20"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonials[current]?.name)}&background=random`;
                                        }}
                                    />
                                    <div className="text-left">
                                        <p className="font-semibold text-sm text-foreground">
                                            {testimonials[current]?.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Đã mua: {testimonials[current]?.product}
                                            {testimonials[current]?.verified && (
                                                <span className="text-primary ml-1">✓ Đã xác nhận</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                onClick={goToPrev}
                                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Dots */}
                            <div className="flex gap-2">
                                {testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrent(index)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${current === index
                                            ? 'w-6 bg-primary'
                                            : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                            }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={goToNext}
                                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
};

export default Testimonials;
