import React, { useState, useRef, useCallback } from "react";
import { PremiumImage } from "./ui/PremiumImage";

interface ImageMagnifierProps {
  src: string;
  className?: string;
  magnifierHeight?: number;
  magnifierWidth?: number;
  zoomLevel?: number;
}

export const ImageMagnifier: React.FC<ImageMagnifierProps> = ({
  src,
  className = "",
  magnifierHeight = 180,
  magnifierWidth = 180,
  zoomLevel = 2.5,
}) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const magnifierRef = useRef<HTMLDivElement>(null);
  const dimensionsRef = useRef({ width: 0, height: 0, top: 0, left: 0 });

  const updatePosition = useCallback((x: number, y: number) => {
    if (!magnifierRef.current) return;

    const { width, height } = dimensionsRef.current;
    
    // Use requestAnimationFrame for smooth 60fps updates
    requestAnimationFrame(() => {
      const el = magnifierRef.current;
      if (!el) return;
      
      // Keep magnifier within image boundaries
      const posX = Math.max(0, Math.min(x, width));
      const posY = Math.max(0, Math.min(y, height));

      el.style.top = `${posY - magnifierHeight / 2}px`;
      el.style.left = `${posX - magnifierWidth / 2}px`;
      el.style.backgroundPosition = `${-posX * zoomLevel + magnifierWidth / 2}px ${-posY * zoomLevel + magnifierHeight / 2}px`;
      el.style.backgroundSize = `${width * zoomLevel}px ${height * zoomLevel}px`;
    });
  }, [magnifierHeight, magnifierWidth, zoomLevel]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    
    // Cache dimensions once on start to avoid layout thrashing during move
    const rect = containerRef.current.getBoundingClientRect();
    dimensionsRef.current = {
      width: rect.width,
      height: rect.height,
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
    };
    
    setShowMagnifier(true);
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    updatePosition(clientX - rect.left, clientY - rect.top);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!showMagnifier) return;
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    // Calculate relative to the cached container position
    const x = clientX - (dimensionsRef.current.left - window.scrollX);
    const y = clientY - (dimensionsRef.current.top - window.scrollY);
    
    updatePosition(x, y);
    
    // Prevent scrolling when using touch magnifier
    if ("touches" in e && e.cancelable) {
        // e.preventDefault(); // Commented out to see if touch-none is sufficient
    }
  };

  const handleEnd = () => {
    setShowMagnifier(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block overflow-hidden cursor-crosshair ${className} touch-none`}
      onMouseEnter={handleStart}
      onMouseMove={handleMove}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      <PremiumImage
        src={src}
        alt="Product View"
        draggable={false}
        className="transition-transform duration-500"
      />

      {showMagnifier && (
        <div
          ref={magnifierRef}
          className="pointer-events-none absolute border-2 border-white/30 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(255,255,255,0.2)]"
          style={{
            height: `${magnifierHeight}px`,
            width: `${magnifierWidth}px`,
            backgroundImage: `url('${src}')`,
            backgroundRepeat: "no-repeat",
            borderRadius: "50%",
            zIndex: 10,
            willChange: "top, left, background-position",
          }}
        />
      )}
    </div>
  );
};

