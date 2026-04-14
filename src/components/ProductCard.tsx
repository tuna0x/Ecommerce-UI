import React from 'react';
import { Star, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { IProduct } from '../types/product.type';
import { useQuickView } from '../context/QuickViewContext';
import { logActivity } from '../service/trackingService';
import { PremiumImage } from './ui/PremiumImage';

interface ProductCardProps {
  product: IProduct;
  showFlashSale?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { openQuickView } = useQuickView();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const displayPrice = product.finalPrice || product.price || 0;
  const displayOriginalPrice = product.originalPrice || 0;
  const discount = product.discount || (displayOriginalPrice > displayPrice && displayOriginalPrice > 0 ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100) : 0);

  const sold = product.stock ? Math.max(0, 50 - product.stock) : 0;
  const total = 50;
  const soldPercent = (sold / total) * 100;

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      openQuickView(product);
    }
  };

  const mainImage = product.thumbnail || (Array.isArray(product.image) && product.image.length > 0 ? product.image[0] : (typeof product.image === 'string' ? product.image : ''));
  const hoverImage = product.hoverImage || (Array.isArray(product.image) && product.image.length > 1 ? product.image[1] : null);

  const handleClick = () => {
    logActivity('CLICK_PRODUCT', {
      productId: product.id,
      productName: product.name,
      source: 'product_listing'
    });
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block"
      onClick={handleClick}
    >
      <div className="bg-card rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        {/* Image Container - 1:1 */}
        <div className="relative aspect-square bg-secondary/30 overflow-hidden">
          <PremiumImage
            src={mainImage}
            alt={product.name}
            className="transition-transform duration-500 group-hover:scale-105"
          />
 
          {hoverImage && (
            <PremiumImage
              src={hoverImage}
              alt={product.name}
              showSkeleton={false}
              containerClassName="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}

          {/* Discount Badge */}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-tight">
              -{discount}%
            </span>
          )}

          {/* Quick View Button */}
          <button
            onClick={handleQuickView}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-primary-foreground shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-1.5">
          {/* Brand + Rating inline */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="uppercase tracking-wide font-medium truncate">
              {typeof product.brand === 'string' ? product.brand : (product.brand?.name || 'No Brand')}
            </span>
            <span className="shrink-0">•</span>
            <span className="flex items-center gap-0.5 shrink-0">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {product.averageRating || product.rating || 0}
              <span className="text-muted-foreground/70">({product.reviewCount || 0})</span>
            </span>
          </div>

          {/* Category */}
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            {typeof product.category === 'string' ? product.category : (product.category?.name || 'No Category')}
          </p>

          {/* Product Name */}
          <h3 className="font-medium text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>

          {/* Pricing */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-primary">
              {formatPrice(displayPrice)}₫
            </span>
            {displayOriginalPrice > displayPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(displayOriginalPrice)}₫
              </span>
            )}
          </div>

          {/* Stock Scarcity Indicator */}
          {product.stock !== undefined && (
            <div className="pt-1.5 space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-medium text-muted-foreground">
                  Đã bán {sold}
                </span>
                {(product.stock ?? 0) < 10 ? (
                  <span className="font-semibold text-primary">
                    🔥 Còn {product.stock} cuối
                  </span>
                ) : (
                  <span className="font-medium text-muted-foreground/70">
                    Còn lại {product.stock}
                  </span>
                )}
              </div>
              <div className="relative h-1 w-full rounded-full bg-secondary/60 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-1000 ease-out animate-in slide-in-from-left-full"
                  style={{ width: `${soldPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
