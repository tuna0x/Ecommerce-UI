import React from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { IProduct } from "../types/product.type";
import { Progress } from "../components/ui/progress";

interface ProductCardProps {
  product: IProduct;
  showFlashSale?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showFlashSale = false,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  // Support both backend (finalPrice) and mock (price) fields
  const displayPrice = product.finalPrice || product.price || 0;
  const displayOriginalPrice = product.originalPrice || 0;
  const discount =
    displayOriginalPrice > displayPrice
      ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
      : 0;

  const sold = product.stock ? Math.max(0, 50 - product.stock) : 0;
  const total = 50;
  const soldPercent = (sold / total) * 100;

  // Image handling: thumbnail > first array image > mock image string
  const mainImage =
    product.thumbnail ||
    (Array.isArray(product.image) && product.image.length > 0
      ? product.image[0]
      : typeof (product as unknown as { image: string }).image === "string"
        ? (product as unknown as { image: string }).image
        : "");

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="bg-card rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        {/* Image Container - 1:1 */}
        <div className="relative aspect-square bg-secondary/30 overflow-hidden">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {product.hoverImage && (
            <img
              src={product.hoverImage}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}

          {/* Discount Badge */}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-tight">
              -{discount}%
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-1.5">
          {/* Brand + Rating inline */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="uppercase tracking-wide font-medium truncate">
              {typeof product.brand === "string"
                ? product.brand
                : (product.brand as { name: string })?.name || ""}
            </span>
            <span className="shrink-0">•</span>
            <span className="flex items-center gap-0.5 shrink-0">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {product.averageRating || product.rating || 0}
              <span className="text-muted-foreground/70">
                ({product.reviewCount || 0})
              </span>
            </span>
          </div>

          {/* Category */}
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            {typeof product.category === "string"
              ? product.category
              : (product.category as { name: string })?.name || ""}
          </p>

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

          {/* Flash Sale Progress */}
          {showFlashSale && (
            <div className="pt-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>Đã bán {sold}</span>
                <span>Còn {product.stock ?? 0}</span>
              </div>
              <Progress value={soldPercent} className="h-1.5" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
