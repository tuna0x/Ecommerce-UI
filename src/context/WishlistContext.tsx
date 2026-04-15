import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '../service/wishlistService';
import { toast } from 'sonner';
import type { IProduct } from '../types/product.type';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: IProduct[];
  wishlistCount: number;
  isLoading: boolean;
  toggleWishlist: (productId: number, isWishlisted: boolean) => void;
  isToggling: boolean;
  isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistService.getWishlist,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async ({ productId, isWishlisted }: { productId: number; isWishlisted: boolean }) => {
      if (isWishlisted) {
        return wishlistService.removeFromWishlist(productId);
      } else {
        return wishlistService.addToWishlist(productId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(variables.isWishlisted ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    },
  });

  const wishlistIds = useMemo(() => new Set(wishlist.map((p: IProduct) => p.id)), [wishlist]);

  const isInWishlist = (productId: number) => {
    return wishlistIds.has(productId);
  };

  const wishlistCount = wishlist.length;

  const value = useMemo(() => ({
    wishlist,
    wishlistCount,
    isLoading,
    toggleWishlist: (productId: number, isWishlisted: boolean) => toggleWishlistMutation.mutate({ productId, isWishlisted }),
    isToggling: toggleWishlistMutation.isPending,
    isInWishlist,
  }), [wishlist, wishlistIds, isLoading, toggleWishlistMutation.isPending]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
