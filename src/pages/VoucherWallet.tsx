import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Copy, Check, Clock, Tag, Percent, Gift, Wallet, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNavBar from '../components/MobileNavBar';
import { voucherService, type UserCoupon, type Coupon } from '../service/voucherService';
import type { IPagination } from '../types/api.type';

const VoucherWallet: React.FC = () => {
    const { toast } = useToast();
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [myVouchers, setMyVouchers] = useState<UserCoupon[]>([]);
    const [availableVouchers, setAvailableVouchers] = useState<Coupon[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [myRes, availableRes] = await Promise.all([
                voucherService.getMyVouchers(),
                voucherService.getAvailableVouchers()
            ]);
            
            // Access data robustly
            if (myRes && myRes.data) {
                if (Array.isArray(myRes.data)) {
                    setMyVouchers(myRes.data);
                } else {
                    const paginatedData = myRes.data as unknown as IPagination<UserCoupon>;
                    if (paginatedData.result && Array.isArray(paginatedData.result)) {
                        setMyVouchers(paginatedData.result);
                    }
                }
            }

            if (availableRes && availableRes.data) {
                if (Array.isArray(availableRes.data)) {
                    setAvailableVouchers(availableRes.data);
                } else {
                    const paginatedData = availableRes.data as unknown as IPagination<Coupon>;
                    if (paginatedData.result && Array.isArray(paginatedData.result)) {
                        setAvailableVouchers(paginatedData.result);
                    }
                }
            }
        } catch (error) {
            console.error("Voucher fetch error:", error);
            toast({
                title: 'Lỗi',
                description: 'Không thể tải dữ liệu ví voucher',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCopyCode = (code: string, id: number) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        toast({ title: 'Đã sao chép mã', description: code });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCollectVoucher = async (id: number) => {
        try {
            await voucherService.collectVoucher(id);
            toast({ title: 'Thành công', description: 'Đã lưu voucher vào ví của bạn!' });
            // Add a small delay to allow backend transaction to fully finalize
            setTimeout(() => {
                fetchData();
            }, 500);
        } catch (error) {
            console.error("Collect voucher error:", error);
            toast({
                title: 'Lỗi',
                description: 'Không thể lưu voucher này',
                variant: 'destructive'
            });
        }
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


    const VoucherCard = memo(({ voucher, isUserVoucher, formatValue, formatDate, handleCollectVoucher, handleCopyCode, copiedId }: {
        voucher: UserCoupon | Coupon;
        isUserVoucher: boolean;
        formatValue: (coupon: Coupon) => string;
        formatDate: (date: string) => string;
        handleCollectVoucher: (id: number) => Promise<void>;
        handleCopyCode: (code: string, id: number) => void;
        copiedId: number | null;
    }) => {
        const coupon = isUserVoucher ? (voucher as UserCoupon).coupon : (voucher as Coupon);
        const isUsed = isUserVoucher && (voucher as UserCoupon).isUsed;
        const diff = new Date(coupon.endDate).getTime() - Date.now();
        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24)) > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;

        return (
            <motion.div
                layout="position"
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`relative overflow-hidden rounded-xl border transition-shadow ${isUsed
                    ? 'border-border/50 bg-muted/50 opacity-60'
                    : 'border-border bg-card hover:shadow-md hover:border-primary/20'
                    }`}
            >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-background border border-border z-10" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-background border border-border z-10" />

                <div className="flex">
                    <div className={`flex flex-col items-center justify-center px-4 py-6 min-w-[110px] border-r border-dashed ${isUsed ? 'border-border/50' : 'border-border'
                        }`}>
                        <div className={`text-xl font-bold ${isUsed ? 'text-muted-foreground' : 'text-primary'}`}>
                            {formatValue(coupon)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold tracking-tighter">
                            {coupon.type === 'PERCENT' ? 'GIẢM GIÁ' : 'GIẢM TIỀN'}
                        </div>
                        {coupon.type === 'PERCENT' && coupon.maxDiscountValue && (
                            <div className="text-[9px] text-muted-foreground mt-0.5">
                                Tối đa {coupon.maxDiscountValue.toLocaleString('vi-VN')}đ
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                            <div className="flex items-start justify-between gap-2">
                                <h3 className={`font-semibold text-sm line-clamp-1 ${isUsed ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    {coupon.name}
                                </h3>
                                {isUsed && (
                                    <Badge variant="outline" className="text-[9px] shrink-0 h-4 px-1">Đã dùng</Badge>
                                )}
                                {!isUsed && daysLeft <= 3 && daysLeft > 0 && (
                                    <Badge variant="destructive" className="text-[9px] shrink-0 h-4 px-1">Sắp hết hạn</Badge>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{coupon.description}</p>
                            {coupon.minOrderValue && (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Đơn từ: {coupon.minOrderValue.toLocaleString('vi-VN')}đ
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="w-3 h-3 text-orange-500" />
                                <span>HSD: {formatDate(coupon.endDate)}</span>
                            </div>

                            {!isUserVoucher ? (
                                <Button
                                    size="sm"
                                    className="h-7 text-[11px] px-3 font-semibold"
                                    onClick={() => handleCollectVoucher(coupon.id)}
                                >
                                    <Gift className="w-3 h-3 mr-1" />
                                    Lưu ngay
                                </Button>
                            ) : !isUsed ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[11px] px-3 font-bold border-primary/20 hover:bg-primary/5 group"
                                    onClick={() => handleCopyCode(coupon.code, coupon.id)}
                                >
                                    {copiedId === coupon.id ? (
                                        <><Check className="w-3 h-3 mr-1" /> Đã chép</>
                                    ) : (
                                        <><Copy className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" /> {coupon.code}</>
                                    )}
                                </Button>
                            ) : (
                                <span className="text-[10px] text-muted-foreground line-through font-mono">{coupon.code}</span>
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
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl pb-24 md:pb-8">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                            <Wallet className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">Ví Voucher</h1>
                            <p className="text-sm text-muted-foreground">
                                {loading ? 'Đang cập nhật...' : `Bạn đang có ${activeVouchers.length} voucher có thể sử dụng`}
                            </p>
                        </div>
                    </div>
                    {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                </motion.div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { icon: Ticket, label: 'Đang có', value: activeVouchers.length, color: 'text-primary' },
                        { icon: Tag, label: 'Đã dùng', value: usedVouchers.length, color: 'text-muted-foreground' },
                        { icon: Percent, label: 'Có thể thu', value: availableVouchers.length, color: 'text-orange-500' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-card border border-border/60 rounded-xl p-3 text-center shadow-sm">
                            <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                            <div className="text-lg font-bold text-foreground leading-none mb-1 text-display">{stat.value}</div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <Tabs defaultValue="my-vouchers" className="space-y-4">
                    <TabsList className="w-full grid grid-cols-3 h-11 p-1 bg-muted/50 rounded-xl">
                        <TabsTrigger value="my-vouchers" className="rounded-lg text-xs font-semibold">Của tôi</TabsTrigger>
                        <TabsTrigger value="collect" className="rounded-lg text-xs font-semibold">Thu thập</TabsTrigger>
                        <TabsTrigger value="used" className="rounded-lg text-xs font-semibold">Lịch sử</TabsTrigger>
                    </TabsList>

                    <TabsContent value="my-vouchers" className="space-y-3 outline-none">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {activeVouchers.length > 0 ? (
                                activeVouchers.map(v => (
                                    <VoucherCard
                                        key={v.id}
                                        voucher={v}
                                        isUserVoucher={true}
                                        formatValue={formatValue}
                                        formatDate={formatDate}
                                        handleCollectVoucher={handleCollectVoucher}
                                        handleCopyCode={handleCopyCode}
                                        copiedId={copiedId}
                                    />
                                ))
                            ) : !loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-12 text-muted-foreground"
                                >
                                    <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium text-foreground">Chưa có voucher nào</p>
                                    <p className="text-xs mt-1">Hãy thu thập voucher từ tab "Thu thập"!</p>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </TabsContent>

                    <TabsContent value="collect" className="space-y-3 outline-none">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {availableVouchers.length > 0 ? (
                                availableVouchers.map(v => (
                                    <VoucherCard
                                        key={v.id}
                                        voucher={v}
                                        isUserVoucher={false}
                                        formatValue={formatValue}
                                        formatDate={formatDate}
                                        handleCollectVoucher={handleCollectVoucher}
                                        handleCopyCode={handleCopyCode}
                                        copiedId={copiedId}
                                    />
                                ))
                            ) : !loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-12 text-muted-foreground"
                                >
                                    <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium text-foreground">Đã thu thập hết!</p>
                                    <p className="text-xs mt-1 text-green-600 dark:text-green-500 font-medium">Bạn đã lưu tất cả voucher hiện có.</p>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </TabsContent>

                    <TabsContent value="used" className="space-y-3 outline-none">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {usedVouchers.length > 0 ? (
                                usedVouchers.map(v => (
                                    <VoucherCard
                                        key={v.id}
                                        voucher={v}
                                        isUserVoucher={true}
                                        formatValue={formatValue}
                                        formatDate={formatDate}
                                        handleCollectVoucher={handleCollectVoucher}
                                        handleCopyCode={handleCopyCode}
                                        copiedId={copiedId}
                                    />
                                ))
                            ) : !loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-12 text-muted-foreground"
                                >
                                    <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium text-foreground">Chưa có lịch sử sử dụng</p>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </TabsContent>
                </Tabs>
            </main>

            <Footer />
            <MobileNavBar />
        </div>
    );
};

export default VoucherWallet;
