import React from 'react';
import { Skeleton } from './ui/skeleton';

const ProductCardSkeleton: React.FC = () => {
    return (
        <div className="bg-card rounded-lg overflow-hidden flex flex-col h-full border border-border/50">
            {/* Image Skeleton - 1:1 */}
            <Skeleton className="aspect-square w-full rounded-none" />

            {/* Content Skeleton */}
            <div className="p-3 space-y-3">
                {/* Brand + Rating */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-4 rounded-full" />
                    <Skeleton className="h-3 w-12" />
                </div>

                {/* Category */}
                <Skeleton className="h-2 w-16" />

                {/* Product Name */}
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-2 pt-1">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-16" />
                </div>

                {/* Progress bar area */}
                <div className="pt-2 space-y-1.5">
                    <div className="flex justify-between">
                        <Skeleton className="h-2 w-12" />
                        <Skeleton className="h-2 w-12" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default ProductCardSkeleton;
