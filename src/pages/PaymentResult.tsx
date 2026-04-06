import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ShoppingBag, ArrowLeft, Receipt } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useCart } from '../context/CartContext';
import { useToast } from '../hooks/use-toast';

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
    const isCod = method === 'cod';

    React.useEffect(() => {
        if (isSuccess && !hasClearedRef.current) {
            // Debug logs to see what's actually coming in
            console.log("Payment Result Mounted:", { status, orderId, transactionId, method });
            
            // Delay a bit to ensure the user sees the page first
            setTimeout(() => {
                clearSelectedItems();
            }, 500);
            hasClearedRef.current = true;
            
            const displayId = transactionId && transactionId !== 'undefined' && transactionId !== 'null' ? transactionId : orderId;
            
            toast({
                title: isCod ? "Đặt hàng thành công" : "Thanh toán thành công",
                description: `Mã đơn hàng: #${displayId}. Cảm ơn bạn đã mua sắm tại BeautyLux!`,
            });
        }
    }, [isSuccess, isCod, clearSelectedItems, toast, orderId, transactionId, status, method]);

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
                    <div className={`absolute top-0 left-0 w-full h-32 ${isSuccess ? 'bg-primary/10' : 'bg-destructive/10'}`}></div>
                    
                    <CardHeader className="pt-12 pb-6 relative z-10 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="mx-auto mb-4"
                        >
                            {isSuccess ? (
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
                            {isSuccess 
                                ? (isCod ? 'Đặt hàng thành công!' : 'Thanh toán thành công!') 
                                : 'Thanh toán thất bại'}
                        </CardTitle>
                        {isSuccess && (
                           <p className="text-sm font-medium text-primary mt-2">
                              Mã đơn hàng: #{(!transactionId || transactionId === 'undefined' || transactionId === 'null') ? 'Đang xử lý...' : transactionId}
                           </p>
                        )}
                        <p className="text-muted-foreground mt-2">
                            {isSuccess 
                                ? (isCod 
                                    ? 'Đơn hàng của bạn đã được ghi nhận. Vui lòng chuẩn bị tiền mặt khi nhận hàng.' 
                                    : 'Cảm ơn bạn đã mua sắm tại BeautyLux. Giao dịch của bạn đã hoàn tất.')
                                : message || 'Rất tiếc quá trình thanh toán của bạn không thành công. Vui lòng thử lại hoặc chọn phương thức khác.'
                            }
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {isSuccess && (
                            <div className="bg-muted p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Mã đơn hàng:</span>
                                    <span className="font-semibold text-foreground uppercase">
                                        {(!transactionId || transactionId === 'undefined' || transactionId === 'null') ? 'Đang xử lý...' : transactionId}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Phương thức:</span>
                                    <span className="font-semibold text-foreground">
                                        {isCod ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán qua VNPay'}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {!isSuccess && (
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
                            onClick={() => navigate('/orders')}
                            variant={isSuccess ? "default" : "outline"}
                        >
                            <Receipt className="w-4 h-4" />
                            Xem đơn hàng
                        </Button>
                        <Button 
                            className="w-full relative group overflow-hidden"
                            onClick={() => navigate('/')}
                            variant={isSuccess ? "outline" : "default"}
                        >
                            <span className="absolute inset-0 bg-primary/10 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300"></span>
                            <div className="flex items-center justify-center gap-2 relative z-10 w-full h-full">
                                {isSuccess ? <ArrowLeft className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
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
