import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Shield, RotateCcw, Headphones } from 'lucide-react';

const features = [
    {
        icon: Truck,
        title: 'Miễn phí vận chuyển',
        description: 'Đơn hàng từ 500.000₫',
    },
    {
        icon: Shield,
        title: '100% chính hãng',
        description: 'Cam kết hàng thật',
    },
    {
        icon: RotateCcw,
        title: 'Đổi trả 30 ngày',
        description: 'Hoàn tiền nếu lỗi',
    },
    {
        icon: Headphones,
        title: 'Hỗ trợ 24/7',
        description: 'Tư vấn miễn phí',
    },
];

const FeaturesBar: React.FC = () => {
    return (
        <section className="py-8 md:py-10 border-b border-border">
            <div className="container mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-center gap-4"
                        >
                            <div className="flex-shrink-0 p-3 bg-primary/8 rounded-2xl">
                                <feature.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">{feature.title}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesBar;