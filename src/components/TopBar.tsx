import React from "react";
import { motion } from "framer-motion";
import { Gift, Truck, Shield } from "lucide-react";
function TopBar() {
  const promos = [
    { icon: Gift, text: "SALE UP TO 50% - Mã BEAUTY50" },
    { icon: Truck, text: "FREESHIP đơn từ 500K" },
    { icon: Shield, text: "100% HÀNG CHÍNH HÃNG" },
  ];
  return (
    <div className="bg-foreground text-background py-2 overflow-hidden">
      <div className="container mx-auto">
        <div className="flex items-center justify-center gap-8 text-xs font-medium">
          {/* Desktop: Show all promos */}
          <div className="hidden md:flex items-center gap-8">
            {promos.map((promo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2"
              >
                <promo.icon className="w-3.5 h-3.5 text-primary" />
                <span>{promo.text}</span>
              </motion.div>
            ))}
          </div>
          {/* Mobile: Marquee */}
          <div className="md:hidden whitespace-nowrap animate-marquee flex items-center gap-8">
            {promos.map((promo, index) => (
              <div key={index} className="flex items-center gap-2">
                <promo.icon className="w-3.5 h-3.5 text-primary" />
                <span>{promo.text}</span>
              </div>
            ))}
            {promos.map((promo, index) => (
              <div key={`dup-${index}`} className="flex items-center gap-2">
                <promo.icon className="w-3.5 h-3.5 text-primary" />
                <span>{promo.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
