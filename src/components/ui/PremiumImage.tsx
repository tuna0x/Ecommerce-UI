import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";
import { Skeleton } from "./skeleton";

interface PremiumImageProps extends HTMLMotionProps<"img"> {
  containerClassName?: string;
  showSkeleton?: boolean;
}

export const PremiumImage: React.FC<PremiumImageProps> = ({
  src,
  alt,
  className,
  containerClassName,
  showSkeleton = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

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
          src={src}
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
