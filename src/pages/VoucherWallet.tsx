import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Copy, Check, Clock, Tag, Percent, Gift, Wallet, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';

import { type UserCoupon, type Coupon } from '../service/voucherService';
import { useMyVouchers, useAvailableVouchers, useCollectVoucher } from '../hooks/useVouchers';

const VoucherWallet: React.FC = () => {
    const { toast } = useToast();
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // React Query Hooks
    const { data: myVouchers = [], isLoading: isMyLoading } = useMyVouchers();
    const { data: availableVouchers = [], isLoading: isAvailableLoading } = useAvailableVouchers();
    const collectMutation = useCollectVoucher();

    const loading = isMyLoading || isAvailableLoading;

    const handleCopyCode = (code: string, id: number) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        toast({ title: 'Đã sao chép mã', description: code });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCollect = (id: number) => {
        if (collectMutation.isPending) return;
        collectMutation.mutate(id);
    };

    const activeVouchers = myVouchers.filter(v => !v.isUsed);
    const usedVouchers = myVouchers.filter(v => v.isUsed);

    const formatValue = (coupon: Coupon) => {
        if (coupon.type === 'PERCENT') return `${coupon.discountValue}%`;
        return `${(coupon.discountValue).toLocaleString('vi-VN')}đ`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN');
    };

    const VoucherCard = memo(({ 
        voucher, 
        isUserVoucher, 
        isMutating 
    }: {
        voucher: UserCoupon | Coupon;
        isUserVoucher: boolean;
        isMutating?: boolean;
    }) => {
        const coupon = isUserVoucher ? (voucher as UserCoupon).coupon : (voucher as Coupon);
        const isUsed = isUserVoucher && (voucher as UserCoupon).isUsed;
        const diff = new Date(coupon.endDate).getTime() - Date.now();
        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24)) > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;

        return (
            <motion.div
                layout="position"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`relative overflow-hidden rounded-xl border transition-all ${isUsed
                    ? 'border-border/50 bg-muted/50 opacity-60'
                    : 'border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20'
                    } ${isMutating ? 'opacity-70 grayscale-[0.5]' : ''}`}
            >
                {/* Side scallops */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-background border border-border z-10" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-background border border-border z-10" />

                <div className="flex">
                    <div className={`flex flex-col items-center justify-center px-4 py-6 min-w-[100px] border-r border-dashed ${isUsed ? 'border-border/50' : 'border-border'
                        }`}>
                        <div className={`text-xl font-black ${isUsed ? 'text-muted-foreground' : 'text-primary'}`}>
                            {formatValue(coupon)}
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-1 uppercase font-bold tracking-widest text-center">
                            {coupon.type === 'PERCENT' ? 'Giảm giá' : 'Tiền mặt'}
                        </div>
                    </div>

                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <h3 className={`font-bold text-sm line-clamp-1 ${isUsed ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    {coupon.name}
                                </h3>
                                {isUsed && (
                                    <Badge variant="outline" className="text-[8px] shrink-0 h-4 px-1 uppercase font-bold">Đã dùng</Badge>
                                )}
                                {!isUsed && daysLeft <= 3 && daysLeft > 0 && (
                                    <Badge variant="destructive" className="text-[8px] h-4 px-1 uppercase font-bold animate-pulse">Hết hạn</Badge>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{coupon.description}</p>
                            {coupon.minOrderValue && (
                                <p className="text-[10px] text-primary/70 mt-1 font-medium">
                                    Đơn từ: {coupon.minOrderValue.toLocaleString('vi-VN')}đ
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="w-3 h-3 text-orange-400" />
                                <span>{formatDate(coupon.endDate)}</span>
                            </div>

                            {!isUserVoucher ? (
                                <Button
                                    size="sm"
                                    disabled={isMutating}
                                    className="h-7 text-[10px] px-3 font-bold rounded-lg shadow-sm"
                                    onClick={() => handleCollect(coupon.id)}
                                >
                                    {isMutating ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <><Gift className="w-3 h-3 mr-1" /> Nhận ngay</>
                                    )}
                                </Button>
                            ) : !isUsed ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] px-3 font-bold border-primary/20 hover:bg-primary/5 rounded-lg transition-colors"
                                    onClick={() => handleCopyCode(coupon.code, coupon.id)}
                                >
                                    {copiedId === coupon.id ? (
                                        <><Check className="w-3 h-3 mr-1 text-green-500" /> Đã chép</>
                                    ) : (
                                        <><Copy className="w-3 h-3 mr-1" /> {coupon.code}</>
                                    )}
                                </Button>
                            ) : (
                                <span className="text-[10px] text-muted-foreground line-through font-mono opacity-50">{coupon.code}</span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    });

    VoucherCard.displayName = "VoucherCard";

    return (
        <div className="min-h-screen bg-background flex flex-col">

            <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl pb-24 md:pb-8">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 shadow-inner">
                            <Wallet className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground tracking-tight md:text-3xl">Ví Voucher</h1>
                            <p className="text-sm text-muted-foreground font-medium">
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Đang cập nhật...
                                    </span>
                                ) : (
                                    `Bạn có ${activeVouchers.length} ưu đãi hẫ dẫn`
                                )}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { icon: Ticket, label: 'Đang có', value: activeVouchers.length, color: 'text-primary', bg: 'bg-primary/5' },
                        { icon: Tag, label: 'Đã dùng', value: usedVouchers.length, color: 'text-muted-foreground', bg: 'bg-muted/50' },
                        { icon: Percent, label: 'Có thể thu', value: availableVouchers.length, color: 'text-orange-500', bg: 'bg-orange-50/50' },
                    ].map((stat) => (
                        <div key={stat.label} className={`border border-border/40 rounded-2xl p-4 text-center transition-transform hover:scale-[1.02] ${stat.bg}`}>
                            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                            <div className="text-xl font-black text-foreground leading-none mb-1">{stat.value}</div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <Tabs defaultValue="my-vouchers" className="space-y-6">
                    <TabsList className="w-full grid grid-cols-3 h-12 p-1 bg-muted/50 rounded-2xl border border-border/50">
                        <TabsTrigger value="my-vouchers" className="rounded-xl text-xs font-bold uppercase tracking-tight">Của tôi</TabsTrigger>
                        <TabsTrigger value="collect" className="rounded-xl text-xs font-bold uppercase tracking-tight">Thu thập</TabsTrigger>
                        <TabsTrigger value="used" className="rounded-xl text-xs font-bold uppercase tracking-tight">Lịch sử</TabsTrigger>
                    </TabsList>

                    <TabsContent value="my-vouchers" className="space-y-4 outline-none">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {activeVouchers.length > 0 ? (
                                <div className="grid gap-4">
                                    {activeVouchers.map(v => (
                                        <VoucherCard
                                            key={v.id}
                                            voucher={v}
                                            isUserVoucher={true}
                                        />
                                    ))}
                                </div>
                            ) : !loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border"
                                >
                                    <Ticket className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                    <h3 className="font-bold text-foreground capitalize">Chưa có voucher nào</h3>
                                    <p className="text-xs text-muted-foreground mt-2 max-w-[200px] mx-auto">Hãy sang tab "Thu thập" để nhận ngay mã giảm giá mới nhé!</p>
                                </motion.div>
                            ) : (
                                <div className="space-y-4">
                                    {[1,2,3].map(i => <div key={i} className="h-28 w-full bg-muted/40 animate-pulse rounded-xl" />)}
                                </div>
                            )}
                        </AnimatePresence>
                    </TabsContent>

                    <TabsContent value="collect" className="space-y-4 outline-none">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {availableVouchers.length > 0 ? (
                                <div className="grid gap-4">
                                    {availableVouchers.map(v => (
                                        <VoucherCard
                                            key={v.id}
                                            voucher={v}
                                            isUserVoucher={false}
                                            isMutating={collectMutation.isPending && collectMutation.variables === v.id}
                                        />
                                    ))}
                                </div>
                            ) : !loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-20 bg-emerald-50/20 rounded-3xl border border-dashed border-emerald-100 dark:border-emerald-900/30"
                                >
                                    <Gift className="w-16 h-16 mx-auto mb-4 text-emerald-500 opacity-20" />
                                    <h3 className="font-bold text-foreground">Bạn đã thu thập hết sạch!</h3>
                                    <p className="text-xs text-emerald-600/70 mt-2">Quay lại sau để săn thêm mã mới từ Bông Cosmetic nhé.</p>
                                </motion.div>
                            ) : (
                                <div className="space-y-4">
                                    {[1,2,3].map(i => <div key={i} className="h-28 w-full bg-muted/40 animate-pulse rounded-xl" />)}
                                </div>
                            )}
                        </AnimatePresence>
                    </TabsContent>

                    <TabsContent value="used" className="space-y-4 outline-none">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {usedVouchers.length > 0 ? (
                                <div className="grid gap-4">
                                    {usedVouchers.map(v => (
                                        <VoucherCard
                                            key={v.id}
                                            voucher={v}
                                            isUserVoucher={true}
                                        />
                                    ))}
                                </div>
                            ) : !loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-20 opacity-60"
                                >
                                    <Tag className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                    <p className="text-sm font-medium text-muted-foreground">Bạn chưa sử dụng voucher nào</p>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default VoucherWallet;
