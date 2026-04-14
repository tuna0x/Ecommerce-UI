import React from 'react';
import { Skeleton } from './ui/skeleton';

const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_320px] gap-8">
          {/* Column 1: Gallery */}
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          </div>

          {/* Column 2: Info */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
              <div className="flex items-center gap-3 pt-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>

            <Skeleton className="h-24 w-full rounded-xl" />

            {/* Attributes Skeletons */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-20 rounded-lg" />
                  <Skeleton className="h-10 w-20 rounded-lg" />
                  <Skeleton className="h-10 w-20 rounded-lg" />
                </div>
              </div>
            ))}

            {/* Quantity and Buttons */}
            <div className="space-y-4 pt-4">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-4">
                <Skeleton className="h-12 w-32 rounded-lg" />
                <Skeleton className="h-12 flex-1 rounded-lg" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-14 flex-1 rounded-lg" />
                <Skeleton className="h-14 w-14 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Column 3: Stats/Sidebar (Desktop) */}
          <div className="hidden lg:block space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-60 w-full rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetailSkeleton;
