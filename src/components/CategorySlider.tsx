import React from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Zap, Star, LayoutGrid } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  'cham-soc-da': <Sparkles className="w-5 h-5 text-pink-500" />,
  'trang-diem': <Heart className="w-5 h-5 text-red-500" />,
  'cham-soc-toc': <Zap className="w-5 h-5 text-yellow-500" />,
  'nuoc-hoa': <Star className="w-5 h-5 text-purple-500" />,
  'default': <LayoutGrid className="w-5 h-5 text-primary" />
};

const CategorySlider: React.FC = () => {
  const { data: categories = [] } = useCategories();

  if (categories.length === 0) return null;

  return (
    <div className="w-full py-6 bg-background/50 backdrop-blur-sm sticky top-[148px] md:top-[164px] z-30 border-b border-border md:hidden">
      <div className="container mx-auto px-4 overflow-x-auto no-scrollbar flex items-center gap-4 py-2">
        <Link
          to="/category/all"
          className="flex-shrink-0 flex flex-col items-center gap-2 group"
        >
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-primary-foreground">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary whitespace-nowrap">
            Tất cả
          </span>
        </Link>

        {categories.map((category) => {
          const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
          const icon = categoryIcons[slug] || categoryIcons['default'];

          return (
            <Link
              key={category.id}
              to={`/category/${slug}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
            >
              <motion.div 
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center overflow-hidden transition-all group-hover:bg-primary/10 group-active:bg-primary/20 p-3"
              >
                {category.image ? (
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="group-hover:scale-110 transition-transform">
                    {icon}
                  </div>
                )}
              </motion.div>
              <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary whitespace-nowrap">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySlider;
