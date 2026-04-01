import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CategoryTree } from '../lib/categoryUtils';

interface CategoryDropdownProps {
    categories: CategoryTree[];
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ categories }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setActiveCategory(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            ref={dropdownRef}
            className="relative"
            onMouseLeave={() => {
                setIsOpen(false);
                setActiveCategory(null);
            }}
        >
            {/* Trigger Button */}
            <button
                onMouseEnter={() => setIsOpen(true)}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
                <Menu className="w-4 h-4" />
                Danh mục
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-full left-0 mt-1 z-50 flex"
                    >
                        {/* Category List (Level 1) */}
                        <div className="w-56 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                            {categories.map((category) => {
                                const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
                                const isActive = activeCategory === category.id;
                                return (
                                    <div
                                        key={category.id}
                                        onMouseEnter={() => setActiveCategory(category.id)}
                                        className="relative"
                                    >
                                        <Link
                                            to={`/category/${slug}`}
                                            onClick={() => { setIsOpen(false); setActiveCategory(null); }}
                                            className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                                                }`}
                                        >
                                            <span>{category.name}</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Subcategory Panel (Level 2 + 3) */}
                        <AnimatePresence mode="wait">
                            {activeCategory && (
                                <motion.div
                                    key={activeCategory}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.12 }}
                                    className="ml-0.5 w-[480px] bg-background border border-border rounded-lg shadow-lg p-5"
                                >
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        {categories
                                            .find((c) => c.id === activeCategory)
                                            ?.subcategories.map((sub, i) => {
                                                const parentCategory = categories.find((c) => c.id === activeCategory)!;
                                                const parentSlug = parentCategory.slug || parentCategory.name.toLowerCase().replace(/\s+/g, '-');
                                                return (
                                                    <div key={i}>
                                                        <Link
                                                            to={`/category/${parentSlug}?sub=${encodeURIComponent(sub.name)}`}
                                                            onClick={() => { setIsOpen(false); setActiveCategory(null); }}
                                                            className="font-semibold text-sm text-foreground hover:text-primary transition-colors block mb-1.5"
                                                        >
                                                            {sub.name}
                                                        </Link>
                                                        <div className="space-y-0.5">
                                                            {sub.children.map((child, j) => (
                                                                <Link
                                                                    key={j}
                                                                    to={`/category/${parentSlug}?sub=${encodeURIComponent(sub.name)}&sub2=${encodeURIComponent(child)}`}
                                                                    onClick={() => { setIsOpen(false); setActiveCategory(null); }}
                                                                    className="block text-xs text-muted-foreground hover:text-primary transition-colors py-0.5"
                                                                >
                                                                    {child}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
