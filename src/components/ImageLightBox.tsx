import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageLightboxProps {
    images: string[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (index: number) => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
    images,
    currentIndex,
    isOpen,
    onClose,
    onNavigate,
}) => {
    const [zoomed, setZoomed] = React.useState(false);

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        onNavigate((currentIndex - 1 + images.length) % images.length);
        setZoomed(false);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        onNavigate((currentIndex + 1) % images.length);
        setZoomed(false);
    };

    React.useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + images.length) % images.length);
            if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % images.length);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 backdrop-blur-sm"
                    onClick={onClose}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-background/20 hover:bg-background/40 rounded-full transition-colors z-10"
                    >
                        <X className="w-6 h-6 text-background" />
                    </button>

                    {/* Zoom toggle */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}
                        className="absolute top-4 right-16 p-2 bg-background/20 hover:bg-background/40 rounded-full transition-colors z-10"
                    >
                        {zoomed
                            ? <ZoomOut className="w-6 h-6 text-background" />
                            : <ZoomIn className="w-6 h-6 text-background" />
                        }
                    </button>

                    {/* Counter */}
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-background/20 rounded-full text-background text-sm font-medium z-10">
                        {currentIndex + 1} / {images.length}
                    </div>

                    {/* Prev */}
                    {images.length > 1 && (
                        <button
                            onClick={handlePrev}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-background/20 hover:bg-background/40 rounded-full transition-colors z-10"
                        >
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-background" />
                        </button>
                    )}

                    {/* Image */}
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`max-w-[90vw] max-h-[85vh] ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                        onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}
                    >
                        <img
                            src={images[currentIndex]}
                            alt=""
                            className={`rounded-lg transition-transform duration-300 ${zoomed ? 'scale-150 max-h-[85vh]' : 'max-h-[85vh] object-contain'
                                }`}
                            draggable={false}
                        />
                    </motion.div>

                    {/* Next */}
                    {images.length > 1 && (
                        <button
                            onClick={handleNext}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-background/20 hover:bg-background/40 rounded-full transition-colors z-10"
                        >
                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-background" />
                        </button>
                    )}

                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-background/20 backdrop-blur-sm rounded-full z-10">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); onNavigate(i); setZoomed(false); }}
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden border-2 transition-all ${i === currentIndex ? 'border-primary ring-2 ring-primary/40' : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ImageLightbox;
