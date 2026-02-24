import React from "react";
import { motion } from "framer-motion";
import { brands } from "../data/products";

const BrandsSection: React.FC = () => {
  return (
    <section className="py-8 md:py-12 bg-secondary/50">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Thương Hiệu Nổi Bật
          </h2>
          <p className="text-muted-foreground">
            Các thương hiệu mỹ phẩm hàng đầu thế giới
          </p>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {brands.map((brand, index) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="bg-background rounded-xl p-4 flex items-center justify-center cursor-pointer card-hover aspect-square"
            >
              <span className="text-xs md:text-sm font-medium text-center text-muted-foreground hover:text-foreground transition-colors">
                {brand.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;
