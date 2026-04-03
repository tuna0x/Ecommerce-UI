import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';
import { BannerService } from '../service/bannerService';
import type { IBanner } from '../types/banner.type';

const FeaturedCategories: React.FC = () => {
    const [categories, setCategories] = useState<IBanner[]>([]);

    useEffect(() => {
        const fetchCategoryBanners = async () => {
            try {
                const res = await BannerService.getAll(0, 100);
                if (res.data?.result) {
                    const categoryBanners = res.data.result
                        .filter(b => b.isActive && b.position === 'category')
                        .sort((a, b) => a.order - b.order);
                    setCategories(categoryBanners);
                }
            } catch (error) {
                console.error("Failed to fetch category banners", error);
            }
        };
        fetchCategoryBanners();
    }, []);

    if (categories.length === 0) return null;

    return (
        <section className="py-16 md:py-20">
            <div className="container mx-auto max-w-7xl">
                <ScrollReveal>
                    <div className="text-center mb-10 md:mb-14">
                        <span className="text-primary font-semibold text-[10px] tracking-[0.2em] uppercase mb-2 block">
                            Khám phá
                        </span>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 text-foreground">
                            Danh Mục Nổi Bật
                        </h2>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                            Tìm kiếm sản phẩm theo danh mục yêu thích của bạn
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {categories.map((cat, index) => (
                        <ScrollReveal key={cat.id} delay={index * 0.1}>
                            <Link
                                to={cat.link || '#'}
                                className="group relative block rounded-2xl overflow-hidden aspect-[3/4]"
                            >
                                {/* Image */}
                                <img
                                    src={cat.image}
                                    alt={cat.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />

                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                                    <span className="text-[10px] uppercase tracking-[0.15em] text-primary-foreground/70 font-medium">
                                        {cat.subtitle || 'Khám phá'}
                                    </span>
                                    <h3 className="text-lg md:text-xl font-bold text-primary-foreground mt-1">
                                        {cat.title}
                                    </h3>
                                    <p className="text-primary-foreground/70 text-xs mt-1 leading-relaxed">
                                        {cat.description}
                                    </p>

                                    {/* Hover line accent */}
                                    <div className="mt-3 h-[2px] w-0 group-hover:w-12 bg-primary transition-all duration-500" />
                                </div>
                            </Link>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedCategories;
