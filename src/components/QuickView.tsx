import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ShoppingBag, Heart } from 'lucide-react';
import type { IProduct } from '../types/product.type';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useState, useMemo, useEffect } from 'react';

interface QuickViewProps {
  product: IProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuickView: React.FC<QuickViewProps> = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});



  // Group all attributes by name from variants for the selector
  const groupedAttributes = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return [];
    
    const groups: Record<string, Set<string>> = {};
    
    product.variants.forEach(v => {
      v.variantAttributes.forEach(va => {
        if (!groups[va.name]) groups[va.name] = new Set();
        groups[va.name].add(va.value);
      });
    });

    return Object.entries(groups).map(([name, values]) => ({ 
      name, 
      values: Array.from(values) 
    }));
  }, [product]);

  // Handle automatic attribute selection when modal opens
  useEffect(() => {
    if (isOpen && groupedAttributes.length > 0) {
      const newSelection: Record<string, string> = { ...selectedAttributes };
      let changed = false;

      groupedAttributes.forEach(attr => {
        if (attr.values.length > 0 && !newSelection[attr.name]) {
          newSelection[attr.name] = attr.values[0];
          changed = true;
        }
      });
      
      if (changed) {
        setSelectedAttributes(prev => ({ ...prev, ...newSelection }));
      }
    }
  }, [isOpen, groupedAttributes]);

  // Find the variant that matches selected attributes
  const matchedVariant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return null;
    
    return product.variants.find(v => {
      // Every selected attribute must match the variant's attributes
      return Object.entries(selectedAttributes).every(([attrName, selectedVal]) => {
        return v.variantAttributes.some(va => va.name === attrName && va.value === selectedVal);
      });
    });
  }, [product, selectedAttributes]);

  if (!product) return null;

  const displayPrice = matchedVariant?.price || product.finalPrice || product.price || 0;
  const currentStock = matchedVariant ? matchedVariant.stock : (product.stock || 0);
  const displayOriginalPrice = product.originalPrice || 0;
  const discount = product.discount || (displayOriginalPrice > displayPrice ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100) : 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const handleAddToCart = () => {
    addToCart(product, matchedVariant?.id || null, matchedVariant?.variantAttributes || null, 1);
    toast.success('Đã thêm vào giỏ hàng!');
    onClose();
  };

  const handleToggleWishlist = () => {
    toast.info('Tính năng yêu thích đang được phát triển');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="grid md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative aspect-square bg-secondary/30">
                  <img
                    src={product.thumbnail || (Array.isArray(product.image) ? product.image[0] : (product.image ?? ''))}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {discount > 0 && (
                    <span className="absolute top-3 left-3 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold">
                      -{discount}%
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-6 md:p-8 flex flex-col justify-center space-y-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                      {typeof product.brand === 'string' ? product.brand : product.brand.name}
                    </span>
                    <h3 className="text-lg md:text-xl font-bold text-foreground mt-1 leading-tight">
                      {product.name}
                    </h3>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(product.averageRating || product.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {product.averageRating || product.rating || 0} ({product.reviewCount || 0} đánh giá)
                    </span>
                  </div>

                  {/* Attributes Selection */}
                  {groupedAttributes.length > 0 && (
                    <div className="space-y-3">
                      {groupedAttributes.map((attr, idx) => (
                        <div key={idx} className="space-y-1.5 text-left">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase">{attr.name}</p>
                          <div className="flex flex-wrap gap-2">
                            {attr.values.map((val, vIdx) => {
                              const isSelected = selectedAttributes[attr.name] === val;
                              return (
                                <button 
                                  key={vIdx}
                                  onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: val }))}
                                  className={cn(
                                    "px-3 py-1.5 border rounded-lg text-xs font-medium transition-all duration-200",
                                    isSelected 
                                      ? "border-primary bg-primary/10 text-primary" 
                                      : "border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                                  )}
                                >
                                  {val}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(displayPrice)}₫
                    </span>
                    {displayOriginalPrice > displayPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(displayOriginalPrice)}₫
                      </span>
                    )}
                  </div>

                  {/* Stock */}
                  {currentStock > 0 && currentStock < 10 && (
                    <p className="text-xs font-semibold text-primary">
                      🔥 Chỉ còn {currentStock} sản phẩm cuối
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-md"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Thêm vào giỏ
                    </button>
                    <button
                      onClick={handleToggleWishlist}
                      className="w-12 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickView;
