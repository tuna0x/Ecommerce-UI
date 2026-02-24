import React from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../data/products";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="bg-card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative aspect-[3/4] bg-secondary/30 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Hover Image */}
          {product.hoverImage && (
            <img
              src={product.hoverImage}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}

          {/* Category Badge */}
          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-foreground shadow-sm">
            {product.category}
          </span>

          {/* Discount Badge */}
          {product.discount && product.discount > 0 && (
            <span className="absolute top-3 right-3 bg-primary text-white px-2.5 py-1 rounded-full text-xs font-bold">
              -{product.discount}%
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-foreground">
              {product.rating}
            </span>
          </div>

          {/* Name */}
          <h3 className="font-medium text-base leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-lg font-bold text-foreground">
              {formatPrice(product.price)}₫
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}₫
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
