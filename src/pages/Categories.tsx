import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';

import { Card, CardContent } from '../components/ui/card';
import { Loader2, ChevronRight, LayoutGrid, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Categories: React.FC = () => {
    const navigate = useNavigate();
    const { data: categories = [], isLoading } = useCategories();

    // Visual helper for categories - matching some common skincare colors
    const getBgColor = (index: number) => {
        const colors = [
            'bg-pink-50 text-pink-600 border-pink-100',
            'bg-rose-50 text-rose-600 border-rose-100',
            'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
            'bg-purple-50 text-purple-600 border-purple-100',
            'bg-indigo-50 text-indigo-600 border-indigo-100',
            'bg-sky-50 text-sky-600 border-sky-100',
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">

            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50 px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200/50">
                        <LayoutGrid className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground tracking-tight">Danh mục sản phẩm</h1>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Khám phá vẻ đẹp của bạn</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground animate-pulse text-sm">Đang tải danh mục...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {categories.map((category, index) => (
                            <motion.div
                                key={category.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card 
                                    className={`cursor-pointer border-0 shadow-sm overflow-hidden h-full ${getBgColor(index)}`}
                                    onClick={() => navigate(`/category/${category.slug}`)}
                                >
                                    <CardContent className="p-5 flex flex-col items-center text-center justify-between h-full min-h-[140px]">
                                        <div className="h-12 w-12 rounded-2xl bg-white/50 backdrop-blur-md flex items-center justify-center mb-4 shadow-sm">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-sm tracking-tight">{category.name}</h3>
                                            <p className="text-[10px] opacity-70 font-medium">
                                                {category.children?.length || 0} danh mục con
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                                            Xem ngay <ChevronRight className="h-3 w-3" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Promotional banner or tip */}
                {!isLoading && categories.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 p-6 rounded-[2.5rem] bg-gradient-to-r from-pink-500 to-rose-500 text-white relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <h2 className="text-lg font-bold mb-1">Chăm sóc da toàn diện</h2>
                            <p className="text-xs opacity-90 leading-relaxed max-w-[240px]">
                                Tham khảo bí quyết từ chuyên gia cho từng loại da tại blog của chúng tôi.
                            </p>
                        </div>
                        <Sparkles className="absolute right-[-10px] top-[-10px] h-24 w-24 text-white/10 rotate-12" />
                    </motion.div>
                )}
            </main>

        </div>
    );
};

export default Categories;
