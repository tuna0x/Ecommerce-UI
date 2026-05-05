import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn, optimizeImage } from "../../lib/utils";
import { Skeleton } from "./skeleton";

interface PremiumImageProps extends HTMLMotionProps<"img"> {
  containerClassName?: string;
  showSkeleton?: boolean;
  width?: number;
}

export const PremiumImage: React.FC<PremiumImageProps> = ({
  src,
  alt,
  className,
  containerClassName,
  showSkeleton = true,
  width = 800,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const optimizedSrc = optimizeImage(src, width);

  return (
    <div className={cn("relative overflow-hidden w-full h-full", containerClassName)}>
      {/* Skeleton / Placeholder */}
      <AnimatePresence>
        {!isLoaded && showSkeleton && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
          >
            <Skeleton className="w-full h-full rounded-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual Image */}
      {src ? (
        <motion.img
          src={optimizedSrc}
          alt={alt}
          loading="lazy"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={isLoaded ? {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5, ease: "easeOut" }
          } : {}}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "w-full h-full object-cover",
            className
          )}
          {...props}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-secondary/20">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest px-2 text-center">
            No image
          </span>
        </div>
      )}
    </div>
  );
};
