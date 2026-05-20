import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ShoppingBag, ArrowLeft, Receipt, Clock, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useCart } from '../context/CartContext';
import { useToast } from '../hooks/use-toast';
import { logActivity } from '../service/trackingService';

const PaymentResult: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearSelectedItems } = useCart();
    const { toast } = useToast();

    // Ensure we only clear the items once when the component mounts
    const hasClearedRef = React.useRef(false);

    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    const transactionId = searchParams.get('transactionId');
    const message = searchParams.get('message');
    const method = searchParams.get('method');

    const isSuccess = status === 'success';
    const isConfirmed = status === 'confirmed';
    const isCod = method === 'cod';
    const isAnySuccess = isSuccess || isConfirmed;

    const displayTransactionId = (transactionId && transactionId !== 'undefined' && transactionId !== 'null') 
        ? transactionId 
        : (orderId && orderId !== 'undefined' && orderId !== 'null' ? `#${orderId}` : '...');

    const preloadRoute = React.useCallback((path: string) => {
        if (path === '/orders') return import('./Orders');
        if (path === '/checkout') return import('./Checkout');
        if (path === '/') return import('./Index');
        return Promise.resolve();
    }, []);

    const navigateSmoothly = React.useCallback(async (path: string) => {
        await preloadRoute(path);
        navigate(path);
    }, [navigate, preloadRoute]);

    React.useEffect(() => {
        void preloadRoute(isAnySuccess ? '/orders' : '/checkout');
        void preloadRoute('/');
    }, [isAnySuccess, preloadRoute]);

    React.useEffect(() => {
        if (isAnySuccess && !hasClearedRef.current) {
            // Delay a bit to ensure the user sees the page first
            setTimeout(() => {
                clearSelectedItems();
            }, 500);
            hasClearedRef.current = true;

            logActivity('PURCHASE', { orderId, transactionId, method });

            toast({
                title: isConfirmed ? "Xác nhận thành công" : (isCod ? "Đã tiếp nhận đơn hàng" : "Thanh toán thành công"),
                description: isConfirmed 
                    ? "Đơn hàng của bạn đã được xác nhận thành công. Cảm ơn bạn!"
                    : `Mã giao dịch: ${displayTransactionId}. Cảm ơn bạn đã mua sắm tại BÔNGCOSMETIC!`,
            });
        }
    }, [isAnySuccess, isSuccess, isConfirmed, isCod, clearSelectedItems, toast, orderId, transactionId, status, method, displayTransactionId]);

    return (
        <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-muted/30 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <Card className="border-none shadow-xl overflow-hidden relative">
                    {/* Decorative Header Background */}
                    <div className={`absolute top-0 left-0 w-full h-32 ${isConfirmed ? 'bg-primary/10' : (isCod && isSuccess ? 'bg-amber-500/10' : (isSuccess ? 'bg-primary/10' : 'bg-destructive/10'))}`}></div>

                    <CardHeader className="pt-12 pb-6 relative z-10 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="mx-auto mb-4"
                        >
                            {isConfirmed ? (
                                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-12 h-12 text-primary" />
                                </div>
                            ) : (isCod && isSuccess) ? (
                                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto relative">
                                    <Clock className="w-12 h-12 text-amber-500" />
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <Mail className="w-5 h-5 text-amber-500" />
                                    </div>
                                </div>
                            ) : isSuccess ? (
                                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-12 h-12 text-primary" />
                                </div>
                            ) : (
                                <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
                                    <XCircle className="w-12 h-12 text-destructive" />
                                </div>
                            )}
                        </motion.div>
                        <CardTitle className="text-2xl font-bold">
                            {isConfirmed ? 'Xác thực thành công!' : 
                             (isCod && isSuccess) ? 'Đang chờ xác nhận!' :
                             isSuccess ? 'Thanh toán thành công!' : 
                             message === 'cancelled' ? 'Thanh toán đã hủy' :
                             'Thanh toán thất bại'}
                        </CardTitle>
                        {isSuccess && (
                            <div className="mt-2">
                                <p className="text-sm font-medium text-primary uppercase tracking-wider">
                                    Mã giao dịch: {displayTransactionId}
                                </p>
                            </div>
                        )}
                        <p className="text-muted-foreground mt-2">
                            {isConfirmed ? 'Đơn hàng của bạn đã được xác nhận thành công và đang được chuẩn bị để giao đi. Cảm ơn bạn!' :
                             isSuccess ? (isCod
                                    ? 'Đơn hàng đã được ghi nhận! Vui lòng kiểm tra email của bạn để bấm xác nhận đơn hàng trước khi chúng tôi giao đi.'
                                    : 'Cảm ơn bạn đã mua sắm tại BÔNGCOSMETIC. Giao dịch của bạn đã hoàn tất.')
                                : message === 'cancelled' 
                                    ? 'Thanh toán đã bị hủy. Đơn hàng của bạn đã được chuyển sang trạng thái đã hủy. Bạn có thể thử đặt lại đơn hàng mới.'
                                    : message || 'Rất tiếc quá trình thanh toán của bạn không thành công. Vui lòng thử lại hoặc chọn phương thức khác.'
                            }
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {isAnySuccess && (
                            <div className="bg-muted p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Mã giao dịch:</span>
                                    <span className="font-semibold text-foreground uppercase truncate ml-4">
                                        {displayTransactionId}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
                                    <span className="text-muted-foreground">Phương thức:</span>
                                    <span className="font-semibold text-foreground">
                                        {isCod ? 'Thanh toán khi nhận hàng (COD)' : method === 'payos' ? 'Thanh toán qua PayOS' : 'Thanh toán qua VNPay'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {!isAnySuccess && (
                            <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/10">
                                <p className="text-sm text-destructive text-center">
                                    Vui lòng kiểm tra lại thông tin thanh toán hoặc thử phương thức khác.
                                </p>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 pb-8">
                        <Button
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => void navigateSmoothly(isAnySuccess ? '/orders' : '/checkout')}
                            variant={isAnySuccess ? "default" : "outline"}
                        >
                            {isAnySuccess ? <Receipt className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                            {isAnySuccess ? 'Xem đơn hàng' : 'Thanh toán lại'}
                        </Button>
                        <Button
                            className="w-full relative group overflow-hidden"
                            onClick={() => void navigateSmoothly('/')}
                            variant={isAnySuccess ? "outline" : "default"}
                        >
                            <span className="absolute inset-0 bg-primary/10 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300"></span>
                            <div className="flex items-center justify-center gap-2 relative z-10 w-full h-full">
                                {isAnySuccess ? <ArrowLeft className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                                Tiếp tục mua sắm
                            </div>
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};

export default PaymentResult;
