import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Truck,
  ShieldCheck,
  Tag,
  Check,
  Wallet,
  Building2,
  Smartphone,
  Plus,
  Ticket,
  ChevronRight,
  Loader2,
  X
} from 'lucide-react';
import { voucherService, type Coupon, type UserCoupon } from '../service/voucherService';
import type { IPagination } from '../types/api.type';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";
import { useCart, FREE_SHIPPING_THRESHOLD } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import type { ShippingAddress } from '../components/AddressManagement';


import { AddressService } from '../service/addressService';

const Checkout: React.FC = () => {
  const { selectedItems, selectedTotal, selectedCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const hasAddresses = addresses.length > 0;

  useEffect(() => {
    const loadAddresses = async () => {
      if (user) {
        try {
          const res = await AddressService.getAll(0, 50);
          if (res.data) {
            const addressList = Array.isArray(res.data) ? res.data : (res.data.result || []);
            const mapped = addressList.map(addr => ({
              id: addr.id,
              fullName: addr.receiverName,
              phone: addr.phone,
              province: addr.province,
              district: addr.district,
              ward: addr.ward,
              street: addr.detail,
              isDefault: addr.isDefault
            }));
            setAddresses(mapped);
            const defaultAddr = mapped.find((a: ShippingAddress) => a.isDefault) || mapped[0];
            if (defaultAddr) setSelectedAddressId(String(defaultAddr.id));
          }
        } catch (err) {
          console.error("Failed to load addresses", err);
        }
      }
    };
    loadAddresses();
  }, [user]);

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: '',
    email: user?.email || '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [isVoucherLoading, setIsVoucherLoading] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    const fetchUserCoupons = async () => {
      if (user) {
        setIsVoucherLoading(true);
        try {
          const res = await voucherService.getMyVouchers();
          if (res && res.data) {
            const data = Array.isArray(res.data)
              ? res.data
              : (res.data as unknown as IPagination<UserCoupon>).result || [];
            setUserCoupons(data.filter((v: UserCoupon) => !v.isUsed));
          }
        } catch (err) {
          console.error("Failed to fetch user coupons", err);
        } finally {
          setIsVoucherLoading(false);
        }
      }
    };
    fetchUserCoupons();
  }, [user]);

  const calculateDiscount = (coupon: Coupon, subTotal: number) => {
    let discount = 0;
    if (coupon.type === 'PERCENT') {
      discount = (subTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountValue && discount > coupon.maxDiscountValue) {
        discount = coupon.maxDiscountValue;
      }
    } else {
      discount = coupon.discountValue;
    }
    return Math.floor(discount);
  };

  const handleApplyCoupon = (coupon: Coupon) => {
    if (selectedTotal < coupon.minOrderValue) {
      toast.error(`Đơn hàng tối thiểu ${formatPrice(coupon.minOrderValue)}₫ để áp dụng mã này`);
      return;
    }
    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
    setDiscountAmount(calculateDiscount(coupon, selectedTotal));
    setIsWalletOpen(false);
    toast.success('Đã áp dụng mã giảm giá');
  };

  const handleManualApply = async () => {
    if (!couponCode) return;

    // Check if code exists in wallet
    const inWallet = userCoupons.find(vc => vc.coupon.code.toUpperCase() === couponCode.toUpperCase());
    if (inWallet) {
      handleApplyCoupon(inWallet.coupon);
      return;
    }

    // Otherwise, we'd ideally call a validation API, but for now we'll search the wallet or show error
    toast.error('Mã giảm giá không hợp lệ hoặc không có trong ví của bạn');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setDiscountAmount(0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const hasFreeShipping = selectedTotal >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = hasFreeShipping ? 0 : 30000;
  const totalAmount = (selectedTotal + shippingFee - discountAmount) > 0 ? (selectedTotal + shippingFee - discountAmount) : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (hasAddresses) {
      if (!selectedAddressId) {
        toast.error('Vui lòng chọn địa chỉ giao hàng');
        return;
      }
    } else {
      if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
        toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
        return;
      }
    }

    if (selectedItems.length === 0) {
      toast.error('Không có sản phẩm nào để thanh toán');
      return;
    }

    setIsSubmitting(true);

    try {
      const { checkoutApi } = await import('../service/orderService');
      const cartItemIds = selectedItems.map(item => item.dbItemId).filter(id => id !== undefined) as number[];

      interface OrderPayload {
        addressId: number;
        cartItemId: number[];
        couponCode: string | null;
        paymentMethod: 'VNPAY' | 'COD';
      }

      const payload: OrderPayload = {
        addressId: parseInt(selectedAddressId as string),
        cartItemId: cartItemIds,
        couponCode: appliedCoupon ? appliedCoupon.code : (couponCode || null),
        paymentMethod: (paymentMethod === 'banking' || paymentMethod === 'vnpay') ? 'VNPAY' : 'COD'
      };

      const res = await checkoutApi(payload);

      if (payload.paymentMethod === 'VNPAY') {
        const data = (res.data?.data || res.data) as { paymentUrl?: string, url?: string };
        const urlToRedirect = data.paymentUrl || data.url;

        if (urlToRedirect) {
          window.location.href = urlToRedirect;
        } else {
          toast.error('Không nhận được URL thanh toán VNPay từ máy chủ');
          setIsSubmitting(false);
        }
      } else {
        const findField = (obj: unknown, field: string): unknown => {
          if (!obj || typeof obj !== 'object') return null;
          const target = obj as Record<string, unknown>;
          if (target[field]) return target[field];
          for (const key in target) {
            const found = findField(target[key], field);
            if (found) return found;
          }
          return null;
        };

        const responseData = res.data?.data || res.data;
        const orderId = findField(responseData, 'id');
        const transactionId = findField(responseData, 'transactionId') || findField(responseData, 'transactionID');

        navigate(`/payment-result?status=success&orderId=${orderId}&transactionId=${transactionId}&method=cod`);
      }
    } catch (err: unknown) {
      console.error("Checkout Error:", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || (err as Error).message || 'Lỗi khi đặt hàng');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Quay lại</span>
          </Link>
          <h1 className="text-xl font-bold">
            BEAUTY<span className="text-primary">LUX</span>
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span className="hidden sm:inline">Thanh toán an toàn</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 lg:py-10">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background rounded-2xl border border-border p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-lg">Thông tin giao hàng</h2>
                    <p className="text-sm text-muted-foreground">
                      {hasAddresses ? 'Chọn địa chỉ giao hàng đã lưu' : 'Điền đầy đủ để chúng tôi giao hàng cho bạn'}
                    </p>
                  </div>
                  {hasAddresses && (
                    <Link to="/account" className="text-sm text-primary hover:underline flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      Quản lý
                    </Link>
                  )}
                </div>

                {hasAddresses ? (
                  <RadioGroup value={selectedAddressId || ''} onValueChange={setSelectedAddressId} className="space-y-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${selectedAddressId === String(addr.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <RadioGroupItem value={String(addr.id)} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{addr.fullName}</span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-sm text-muted-foreground">{addr.phone}</span>
                            {addr.isDefault && (
                              <Badge variant="outline" className="border-primary text-primary text-xs">Mặc định</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {[addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        {selectedAddressId === String(addr.id) && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </label>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Họ và tên *</Label>
                      <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Nguyễn Văn A" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại *</Label>
                      <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="0912 345 678" required />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Địa chỉ *</Label>
                      <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Số nhà, tên đường" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Tỉnh/Thành phố *</Label>
                      <Input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="Hồ Chí Minh" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">Quận/Huyện</Label>
                      <Input id="district" name="district" value={formData.district} onChange={handleInputChange} placeholder="Quận 1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ward">Phường/Xã</Label>
                      <Input id="ward" name="ward" value={formData.ward} onChange={handleInputChange} placeholder="Phường Bến Nghé" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="note">Ghi chú</Label>
                      <Input id="note" name="note" value={formData.note} onChange={handleInputChange} placeholder="Ghi chú cho đơn hàng" />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-background rounded-2xl border border-border p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Phương thức thanh toán</h2>
                    <p className="text-sm text-muted-foreground">Chọn cách thanh toán phù hợp với bạn</p>
                  </div>
                </div>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  <label
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <RadioGroupItem value="cod" id="cod" />
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-sm text-muted-foreground">Thanh toán bằng tiền mặt khi nhận hàng</p>
                    </div>
                    {paymentMethod === 'cod' && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </label>

                  <label
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'banking'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <RadioGroupItem value="banking" id="banking" />
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Chuyển khoản ngân hàng</p>
                      <p className="text-sm text-muted-foreground">Chuyển khoản qua tài khoản ngân hàng</p>
                    </div>
                    {paymentMethod === 'banking' && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </label>

                  <label
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'momo'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <RadioGroupItem value="momo" id="momo" />
                    <div className="w-10 h-10 bg-[#A50064] rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Ví MoMo</p>
                      <p className="text-sm text-muted-foreground">Thanh toán qua ví điện tử MoMo</p>
                    </div>
                    {paymentMethod === 'momo' && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </label>
                </RadioGroup>
              </motion.div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-background rounded-2xl border border-border p-6 sticky top-24"
              >
                <h2 className="font-bold text-lg mb-4">Đơn hàng của bạn</h2>

                {/* Products */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                  {selectedItems.map((item) => {
                    const price = item.finalPrice || item.price || 0;
                    const brandName = item.brand ? (typeof item.brand === 'string' ? item.brand : item.brand.name || 'No Brand') : 'No Brand';
                    const image = item.thumbnail || (Array.isArray(item.image) ? item.image[0] : (item.image ?? ''));

                    return (
                      <div key={item.cartItemId} className="flex gap-3">
                        <div className="relative w-16 h-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{brandName}</p>
                          {/* Attributes Display */}
                          {item.variantAttributes && item.variantAttributes.length > 0 && (
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                              {item.variantAttributes.map((attr, i) => (
                                <span key={i} className="text-[10px] text-muted-foreground/70 bg-secondary/30 px-1.5 py-0.5 rounded">
                                  {attr.name}: {attr.attributeValue}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold whitespace-nowrap">
                          {formatPrice(price * item.quantity)}₫
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />
                      Mã giảm giá
                    </h3>
                    <Dialog open={isWalletOpen} onOpenChange={setIsWalletOpen}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          Chọn từ ví
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl">
                        <DialogHeader className="p-6 pb-2 border-b">
                          <DialogTitle className="flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-primary" />
                            Ví Voucher của bạn
                          </DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh] p-4">
                          {isVoucherLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                              <p className="text-sm text-muted-foreground">Đang tải voucher...</p>
                            </div>
                          ) : userCoupons.length === 0 ? (
                            <div className="text-center py-10">
                              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
                              <p className="text-sm font-medium">Bạn chưa có mã giảm giá nào</p>
                              <p className="text-xs text-muted-foreground mt-1">Hãy thu thập thêm tại trang chủ!</p>
                            </div>
                          ) : (
                            <div className="space-y-3 pr-2">
                              {userCoupons.map((vc) => {
                                const isApplicable = selectedTotal >= vc.coupon.minOrderValue;
                                return (
                                  <button
                                    key={vc.id}
                                    type="button"
                                    disabled={!isApplicable}
                                    onClick={() => handleApplyCoupon(vc.coupon)}
                                    className={`w-full text-left p-4 border rounded-xl flex items-center gap-4 transition-all ${appliedCoupon?.id === vc.coupon.id
                                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                      : isApplicable
                                        ? 'border-border hover:border-primary/50'
                                        : 'border-border/30 opacity-60 grayscale cursor-not-allowed'
                                      }`}
                                  >
                                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 ${isApplicable ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                      <Ticket className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-sm">
                                        {vc.coupon.type === 'PERCENT' ? `${vc.coupon.discountValue}%` : `${formatPrice(vc.coupon.discountValue)}₫`} GIẢM
                                      </p>
                                      <p className="text-[11px] text-muted-foreground line-clamp-1">{vc.coupon.name}</p>
                                      <p className="text-xs font-semibold text-primary mt-1">Mã: {vc.coupon.code}</p>
                                      {!isApplicable && (
                                        <p className="text-[10px] text-destructive mt-1 font-medium">
                                          Cần đơn từ {formatPrice(vc.coupon.minOrderValue)}₫
                                        </p>
                                      )}
                                    </div>
                                    {appliedCoupon?.id === vc.coupon.id && (
                                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-white" />
                                      </div>
                                    )}
                                    {isApplicable && appliedCoupon?.id !== vc.coupon.id && (
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </ScrollArea>
                        <div className="p-4 border-t bg-muted/30">
                          <Button className="w-full" variant="outline" onClick={() => setIsWalletOpen(false)}>Đóng</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {appliedCoupon ? (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Ticket className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-primary">-{formatPrice(discountAmount)}₫</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">Mã: {appliedCoupon.code}</p>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="p-1.5 hover:bg-primary/10 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Nhập mã ưu đãi"
                          className="pl-10 h-11 rounded-xl"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleManualApply}
                        className="px-4 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold text-sm transition-all"
                      >
                        Áp dụng
                      </button>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="space-y-3 py-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính ({selectedCount} sản phẩm)</span>
                    <span>{formatPrice(selectedTotal)}₫</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className={hasFreeShipping ? 'text-accent' : ''}>
                      {hasFreeShipping ? 'Miễn phí' : `${formatPrice(shippingFee)}₫`}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-primary font-medium">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        Giảm giá voucher
                      </span>
                      <span>-{formatPrice(discountAmount)}₫</span>
                    </div>
                  )}
                  {hasFreeShipping && (
                    <div className="flex items-center gap-2 text-xs text-accent bg-accent/10 px-3 py-2 rounded-lg">
                      <Truck className="w-4 h-4" />
                      <span>Bạn đã được miễn phí vận chuyển!</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between py-4 border-t border-border">
                  <span className="text-lg font-bold">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(totalAmount)}₫</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-4 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                      />
                      Đang xử lý...
                    </span>
                  ) : (
                    `Đặt hàng • ${formatPrice(totalAmount)}₫`
                  )}
                </button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Bằng việc đặt hàng, bạn đồng ý với{' '}
                  <a href="#" className="text-primary hover:underline">Điều khoản sử dụng</a>
                  {' '}và{' '}
                  <a href="#" className="text-primary hover:underline">Chính sách bảo mật</a>
                </p>
              </motion.div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
