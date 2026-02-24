import React from "react";
import ProductCard from "./ProductCard";
import { products } from "../data/products";

const ProductGrid: React.FC = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="text-primary font-medium text-sm tracking-wider uppercase mb-3 block">
            Featured
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Our Best Sellers
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Handpicked products that our customers love. Premium quality,
            timeless design.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button className="btn-outline">View All Products</button>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
