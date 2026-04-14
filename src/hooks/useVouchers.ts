import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voucherService, type UserCoupon, type Coupon } from '../service/voucherService';
import { useToast } from '../hooks/use-toast';

export const useMyVouchers = () => {
  return useQuery<UserCoupon[]>({
    queryKey: ['vouchers-my'],
    queryFn: async () => {
      const res = await voucherService.getMyVouchers();
      if (Array.isArray(res.data)) return res.data;
      // Handle pagination if needed
      return (res.data as any)?.result || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useAvailableVouchers = () => {
  return useQuery<Coupon[]>({
    queryKey: ['vouchers-available'],
    queryFn: async () => {
      const res = await voucherService.getAvailableVouchers();
      if (Array.isArray(res.data)) return res.data;
      return (res.data as any)?.result || [];
    },
    staleTime: 60 * 1000,
  });
};

export const useCollectVoucher = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => voucherService.collectVoucher(id),
    
    // Optimistic Update logic
    onMutate: async (id) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['vouchers-my'] });
      await queryClient.cancelQueries({ queryKey: ['vouchers-available'] });

      // Snapshot the previous value
      const previousMy = queryClient.getQueryData<UserCoupon[]>(['vouchers-my']);
      const previousAvailable = queryClient.getQueryData<Coupon[]>(['vouchers-available']);

      // Optimistically update to the new value
      if (previousAvailable) {
        const collectedVoucher = previousAvailable.find(v => v.id === id);
        if (collectedVoucher) {
          // 1. Remove from available
          queryClient.setQueryData<Coupon[]>(
            ['vouchers-available'],
            previousAvailable.filter(v => v.id !== id)
          );

          // 2. Add to my vouchers (mock UserCoupon structure)
          if (previousMy) {
            const optimisticUserCoupon: UserCoupon = {
              id: Math.random(), // Temporary ID
              coupon: collectedVoucher,
              isUsed: false,
              collectedAt: new Date().toISOString(),
              usedAt: null
            };
            queryClient.setQueryData<UserCoupon[]>(
              ['vouchers-my'],
              [optimisticUserCoupon, ...previousMy]
            );
          }
        }
      }

      return { previousMy, previousAvailable };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _id, context) => {
      if (context) {
        queryClient.setQueryData(['vouchers-my'], context.previousMy);
        queryClient.setQueryData(['vouchers-available'], context.previousAvailable);
      }
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu voucher này. Vui lòng thử lại.',
        variant: 'destructive',
      });
    },

    // Always refetch after error or success to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers-my'] });
      queryClient.invalidateQueries({ queryKey: ['vouchers-available'] });
    },

    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Đã lưu voucher vào ví của bạn!',
      });
    }
  });
};
