import React from 'react';
import { Skeleton } from '../components/ui/skeleton';

const ProductCardSkeleton: React.FC = () => {
    return (
        <div className="bg-card rounded-lg overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-3 w-14" />
                </div>
            </div>
        </div>
    );
};

export default ProductCardSkeleton;
