import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Menu, 
    ChevronRight, 
    Palette, 
    Sparkles, 
    UserCircle, 
    Wind, 
    ShoppingBag, 
    Heart, 
    Zap, 
    LayoutGrid,
    Star,
    Scissors,
    Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';

const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('trang điểm')) return Palette;
    if (n.includes('da') || n.includes('skincare')) return Sparkles;
    if (n.includes('mặt') || n.includes('face')) return UserCircle;
    if (n.includes('tóc') || n.includes('hair')) return Wind;
    if (n.includes('phụ kiện') || n.includes('accessory')) return ShoppingBag;
    if (n.includes('nước hoa') || n.includes('perfume')) return Heart;
    if (n.includes('khuyến mãi') || n.includes('sale')) return Zap;
    if (n.includes('mới') || n.includes('new')) return Star;
    if (n.includes('nails') || n.includes('móng')) return Scissors;
    if (n.includes('vệ sinh') || n.includes('clean')) return Shield;
    return LayoutGrid;
};

const CategoryDropdown: React.FC = () => {
    const { data: categories = [] } = useCategories();
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
            setActiveCategory(null);
        }, 300);
    };

    const handleCategoryMouseEnter = (id: number) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setActiveCategory(id);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setActiveCategory(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                    isOpen 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                }`}
            >
                <Menu className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                <span>Danh mục sản phẩm</span>
            </button>

            {/* Dropdown Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.99 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-[calc(100%+8px)] left-0 z-50 flex items-stretch min-h-[400px] transform-gpu"
                    >
                        {/* Sidebar (Level 1) */}
                        <div className="w-64 bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden py-2 flex flex-col justify-start">
                            {categories.map((category) => {
                                const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
                                const isActive = activeCategory === category.id;
                                const Icon = getCategoryIcon(category.name);
                                
                                return (
                                    <div
                                        key={category.id}
                                        onMouseEnter={() => handleCategoryMouseEnter(category.id)}
                                        className="relative px-2"
                                    >
                                        <Link
                                            to={`/category/${slug}`}
                                            onClick={() => { setIsOpen(false); setActiveCategory(null); }}
                                            className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                                                isActive 
                                                ? 'bg-primary/10 text-primary shadow-sm' 
                                                : 'text-foreground hover:bg-secondary/80 hover:pl-5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                                                <span>{category.name}</span>
                                            </div>
                                            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? 'translate-x-0.5 opacity-100' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mega Menu Panel (Level 2 + 3) */}
                        <AnimatePresence>
                            {activeCategory && (
                                <motion.div
                                    key={activeCategory}
                                    initial={{ opacity: 0, x: -4 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -4 }}
                                    transition={{ duration: 0.1 }}
                                    className="ml-3 w-[720px] bg-background/98 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-8 relative overflow-hidden transform-gpu"
                                >
                                    {/* Abstract background element */}
                                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                                    
                                    <div className="relative z-10 grid grid-cols-3 gap-x-10 gap-y-8">
                                        {categories
                                            .find((c) => c.id === activeCategory)
                                            ?.children.map((sub, i) => {
                                                const parentCategory = categories.find((c) => c.id === activeCategory)!;
                                                const parentSlug = parentCategory.slug || parentCategory.name.toLowerCase().replace(/\s+/g, '-');
                                                return (
                                                    <motion.div 
                                                        key={i}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: i * 0.02 }}
                                                    >
                                                        <Link
                                                            to={`/category/${parentSlug}?sub=${encodeURIComponent(sub.name)}`}
                                                            onClick={() => { setIsOpen(false); setActiveCategory(null); }}
                                                            className="font-bold text-[15px] text-foreground hover:text-primary transition-colors block mb-4 border-b border-border/50 pb-2 flex items-center justify-between group"
                                                        >
                                                            <span>{sub.name}</span>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary scale-0 group-hover:scale-100 transition-transform" />
                                                        </Link>
                                                        <ul className="space-y-2.5">
                                                            {sub.children.map((child, j) => (
                                                                <li key={j}>
                                                                    <Link
                                                                        to={`/category/${parentSlug}?sub=${encodeURIComponent(sub.name)}&sub2=${encodeURIComponent(child.name)}`}
                                                                        onClick={() => { setIsOpen(false); setActiveCategory(null); }}
                                                                        className="block text-sm text-muted-foreground hover:text-primary hover:pl-2 transition-all duration-200 border-l border-transparent hover:border-primary/30"
                                                                    >
                                                                        {child.name}
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </motion.div>
                                                );
                                            })}
                                    </div>
                                    
                                    {/* Bottom suggestion/footer if needed */}
                                    <div className="mt-12 pt-6 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground italic">
                                        <p>✨ Khám phá xu hướng làm đẹp mới nhất cùng Bông Cosmetic</p>
                                        <Link to="/flash-sale" className="not-italic font-bold text-primary hover:underline">Xem tất cả sản phẩm →</Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CategoryDropdown;
