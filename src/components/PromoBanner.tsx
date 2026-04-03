import React, { useState } from 'react';
import { Send, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from './ScrollReveal';
import { toast } from 'sonner';

const PromoBanner: React.FC = () => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            toast.success('Đăng ký thành công! Cảm ơn bạn đã theo dõi.');
            setEmail('');
        }
    };

    return (
        <section className="py-16 md:py-20">
            <div className="container mx-auto max-w-7xl">
                <ScrollReveal>
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-border">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <div className="relative grid md:grid-cols-2 gap-8 md:gap-12 p-8 md:p-14 items-center">
                            {/* Left - Promo Content */}
                            <div>
                                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-4">
                                    <Gift className="w-3.5 h-3.5" />
                                    Ưu đãi đặc biệt
                                </span>
                                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 leading-tight">
                                    Giảm 20% cho
                                    <br />
                                    <span className="text-primary">đơn hàng đầu tiên</span>
                                </h2>
                                <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-md">
                                    Đăng ký nhận bản tin để nhận mã giảm giá độc quyền và cập nhật những xu hướng làm đẹp mới nhất.
                                </p>
                            </div>

                            {/* Right - Newsletter Form */}
                            <div className="flex flex-col gap-4">
                                <form onSubmit={handleSubmit} className="flex gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Nhập email của bạn..."
                                        required
                                        className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    />
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-md"
                                    >
                                        <Send className="w-4 h-4" />
                                        <span className="hidden sm:inline">Đăng ký</span>
                                    </motion.button>
                                </form>
                                <p className="text-[11px] text-muted-foreground/70">
                                    Chúng tôi tôn trọng quyền riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
};

export default PromoBanner;
