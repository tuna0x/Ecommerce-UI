import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { logActivity } from '../service/trackingService';
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
  Plus,
  Ticket,
  Loader2,
  X,
  Gift
} from 'lucide-react';
import { voucherService, type Coupon, type UserCoupon } from '../service/voucherService';
import type { IPagination } from '../types/api.type';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
import { addressDataService } from '../service/addressDataService';
import type { LocationItem } from '../service/addressDataService';
import { getShippingFeeApi, getShippingFeePreviewApi } from '../service/shippingService';
import { SearchableSelect } from '../components/SearchableSelect';


import { AddressService } from '../service/addressService';
import { checkoutApi } from '../service/orderService';
import vnpayLogo from '../assets/Logo-VNPAY-QR.webp';
import payosLogo from '../assets/payos.png';

const Checkout: React.FC = () => {
  const { selectedItems, selectedTotal, selectedCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const hasAddresses = addresses.length > 0;

  useEffect(() => {
    logActivity('BEGIN_CHECKOUT', {
      cartTotal: selectedTotal,
      itemCount: selectedCount
    });
  }, []);

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
    isDefault: false,
  });

  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [isCheckingFee, setIsCheckingFee] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [isVoucherLoading, setIsVoucherLoading] = useState(false);
  const [isCollecting, setIsCollecting] = useState<number | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Location Data State
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);

  useEffect(() => {
    const loadProvinces = async () => {
      const data = await addressDataService.getProvinces();
      setProvinces(data);
    };
    loadProvinces();
  }, []);

  const handleProvinceChange = async (provinceName: string) => {
    setFormData(prev => ({ ...prev, city: provinceName, district: '', ward: '' }));
    setIsAddressConfirmed(false);
    setDistricts([]);
    setWards([]);
    
    const province = provinces.find(p => p.name === provinceName);
    if (province) {
      const data = await addressDataService.getDistricts(province.code);
      setDistricts(data);
    }
  };

  const handleDistrictChange = async (districtName: string) => {
    setFormData(prev => ({ ...prev, district: districtName, ward: '' }));
    setIsAddressConfirmed(false);
    setWards([]);

    const district = districts.find(d => d.name === districtName);
    if (district) {
      const data = await addressDataService.getWards(district.code);
      setWards(data);
    }
  };

  const handleConfirmManualAddress = async () => {
    if (!formData.city || !formData.district) {
      toast.error('Vui lòng chọn Tỉnh và Quận/Huyện');
      return;
    }

    const totalWeight = calculateTotalWeight();
    const weightInGrams = Math.round(totalWeight * 1000);

    setIsCheckingFee(true);
    try {
      const res = await getShippingFeePreviewApi(formData.city, formData.district, formData.ward, weightInGrams);
      const feeValue = res?.data !== undefined ? res.data : res;
      
      if (typeof feeValue === 'number') {
        setShippingFee(feeValue);
        setIsAddressConfirmed(true);
        toast.success('Đã xác nhận địa chỉ và tính phí vận chuyển');
        
        const roundedWeight = Math.round(weightInGrams / 100) * 100;
        lastFetchParams.current = { 
          addressId: `manual-${formData.city}-${formData.district}`, 
          weight: roundedWeight 
        };
      } else {
        toast.error('Không thể tính phí vận chuyển. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error("Manual Fee Check Error:", err);
      toast.error('Lỗi khi tính phí vận chuyển');
    } finally {
      setIsCheckingFee(false);
    }
  };

  // Dynamic Shipping Fee
  const [shippingFee, setShippingFee] = useState(0);
  const [isLoadingFee, setIsLoadingFee] = useState(false);

  const fetchVouchers = async () => {
    if (!user) return;
    setIsVoucherLoading(true);
    try {
      const [myRes, availableRes] = await Promise.all([
        voucherService.getMyVouchers(),
        voucherService.getAvailableVouchers()
      ]);
      
      if (myRes && myRes.data) {
        const data = Array.isArray(myRes.data)
          ? myRes.data
          : (myRes.data as unknown as IPagination<UserCoupon>).result || [];
        setUserCoupons(data.filter((v: UserCoupon) => !v.isUsed));
      }
      
      if (availableRes && availableRes.data) {
        const data = Array.isArray(availableRes.data)
          ? availableRes.data
          : (availableRes.data as unknown as IPagination<Coupon>).result || [];
        setAvailableCoupons(data);
      }
    } catch (err) {
      console.error("Failed to fetch vouchers", err);
    } finally {
      setIsVoucherLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [user]);

  const handleCollectVoucher = async (id: number) => {
    setIsCollecting(id);
    try {
      await voucherService.collectVoucher(id);
      toast.success('Đã lưu voucher vào ví!');
      await fetchVouchers();
    } catch (err) {
      console.error("Failed to collect voucher", err);
      toast.error('Không thể lưu voucher này');
    } finally {
      setIsCollecting(null);
    }
  };

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
    if (coupon.minOrderValue && selectedTotal < coupon.minOrderValue) {
      toast.error(`Đơn hàng tối thiểu ${formatPrice(coupon.minOrderValue)} để áp dụng mã này`);
      return;
    }

    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
    const amount = calculateDiscount(coupon, selectedTotal);
    setDiscountAmount(amount);
    setIsWalletOpen(false);
    
    logActivity('USE_COUPON', {
      couponCode: coupon.code,
      discountAmount: amount,
      success: true
    });
    
    toast.success(`Áp dụng thành công! Bạn được giảm ${formatPrice(amount)}`);
  };

  const calculateTotalWeight = () => {
    return selectedItems.reduce((acc, item) => {
      const variant = item.variants?.find(v => v.id === item.variantId);
      const weight = Number(variant?.weight || item.weight || 0.5);
      const quantity = Number(item.quantity || 1);
      return acc + (weight * quantity);
    }, 0);
  };

  const lastFetchParams = useRef<{ addressId: string; weight: number } | null>(null);

  useEffect(() => {
    const fetchShippingFee = async () => {
      if (selectedItems.length === 0) {
        setShippingFee(0);
        return;
      }

      if (selectedTotal >= FREE_SHIPPING_THRESHOLD) {
        setShippingFee(0);
        return;
      }

      // ONLY auto-fetch for saved addresses
      if (!selectedAddressId) {
        // In manual mode, we wait for explicit confirmation
        if (!isAddressConfirmed) {
            setShippingFee(0);
        }
        return;
      }

      const totalWeight = calculateTotalWeight();
      const weightInGrams = Math.round(totalWeight * 1000);
      const roundedWeight = Math.round(weightInGrams / 100) * 100;

      if (
        lastFetchParams.current?.addressId === selectedAddressId &&
        lastFetchParams.current?.weight === roundedWeight
      ) {
        return;
      }

      setIsLoadingFee(true);
      try {
        const res = await getShippingFeeApi(parseInt(selectedAddressId), weightInGrams);
        const feeValue = res?.data !== undefined ? res.data : res;
        
        if (typeof feeValue === 'number') {
          setShippingFee(feeValue);
          lastFetchParams.current = { 
            addressId: selectedAddressId, 
            weight: roundedWeight 
          };
        }
      } catch (err) {
        console.error("Failed to fetch shipping fee", err);
        setShippingFee(30000); 
      } finally {
        setIsLoadingFee(false);
      }
    };

    const timeoutId = setTimeout(fetchShippingFee, 500);
    return () => clearTimeout(timeoutId);
  }, [selectedAddressId, selectedTotal, selectedItems, isAddressConfirmed]);

  const handleManualApply = async () => {
    if (!couponCode) return;

    setIsVoucherLoading(true);
    try {
      const res = await voucherService.validateCoupon(couponCode);
      if (res && res.data) {
        handleApplyCoupon(res.data);
      }
    } catch (err: any) {
      console.error("Failed to validate manual coupon", err);
      const msg = err.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã qua sử dụng';
      toast.error(msg);
    } finally {
      setIsVoucherLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setDiscountAmount(0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const hasFreeShipping = selectedTotal >= FREE_SHIPPING_THRESHOLD;
  const totalAmount = (selectedTotal + shippingFee - discountAmount) > 0 ? (selectedTotal + shippingFee - discountAmount) : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Reset confirmation if critical address fields change
    if (['city', 'district', 'ward', 'address'].includes(name)) {
        setIsAddressConfirmed(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (hasAddresses && selectedAddressId) {
      // Logic for existing address
    } else {
      if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.district) {
        toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
        return;
      }
      
      const phoneRegex = /^(0[35789])[0-9]{8}$/;
      if (!phoneRegex.test(formData.phone)) {
        toast.error('Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10 chữ số)');
        return;
      }

      if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast.error('Định dạng email không hợp lệ');
          return;
        }
      }

      if (!isAddressConfirmed) {
        toast.error('Vui lòng bấm "Xác nhận địa chỉ" để tính phí vận chuyển trước khi đặt hàng');
        return;
      }
    }

    if (selectedItems.length === 0) {
      toast.error('Không có sản phẩm nào để thanh toán');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalAddressId = selectedAddressId ? parseInt(selectedAddressId) : null;

      // If manual entry, save address first
      if (!finalAddressId) {
        try {
          const newAddr = await AddressService.create({
            receiverName: formData.fullName,
            phone: formData.phone,
            province: formData.city,
            district: formData.district,
            ward: formData.ward,
            detail: formData.address,
            isDefault: formData.isDefault
          });
          
          if (newAddr.data) {
            finalAddressId = (newAddr.data as any).id || (newAddr.data as any).result?.id;
          }
        } catch (addrErr) {
          console.error("Failed to save manual address during checkout", addrErr);
          throw new Error("Không thể lưu địa chỉ giao hàng. Vui lòng thử lại.");
        }
      }

      if (!finalAddressId) {
        throw new Error("Không tìm thấy địa chỉ giao hàng hợp lệ");
      }

      const cartItemIds = selectedItems.map(item => item.dbItemId).filter(id => id !== undefined) as number[];

      interface OrderPayload {
        addressId: number;
        cartItemId: number[];
        couponCode: string | null;
        paymentMethod: 'VNPAY' | 'COD' | 'PAYOS';
      }

      const mapPaymentMethod = (): 'VNPAY' | 'COD' | 'PAYOS' => {
        if (paymentMethod === 'vnpay') return 'VNPAY';
        if (paymentMethod === 'payos') return 'PAYOS';
        return 'COD';
      };

      const payload: OrderPayload = {
        addressId: finalAddressId,
        cartItemId: cartItemIds,
        couponCode: appliedCoupon ? appliedCoupon.code : (couponCode || null),
        paymentMethod: mapPaymentMethod()
      };

      const res = await checkoutApi(payload);

      if (payload.paymentMethod === 'VNPAY' || payload.paymentMethod === 'PAYOS') {
        const data = (res.data?.data || res.data) as { paymentUrl?: string, url?: string, checkoutUrl?: string };
        const urlToRedirect = data.paymentUrl || data.checkoutUrl || data.url;

        if (urlToRedirect) {
          window.location.href = urlToRedirect;
        } else {
          toast.error('Không nhận được URL thanh toán từ máy chủ');
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
                       <Label>Tỉnh/Thành phố *</Label>
                       <SearchableSelect 
                           options={provinces.map(p => ({ value: p.name, label: p.name }))}
                           value={formData.city}
                           onValueChange={handleProvinceChange}
                           placeholder="Chọn Tỉnh/TP"
                           className="h-11 rounded-xl"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label>Quận/Huyện *</Label>
                       <SearchableSelect 
                           options={districts.map(d => ({ value: d.name, label: d.name }))}
                           value={formData.district}
                           onValueChange={handleDistrictChange}
                           placeholder="Chọn Quận/Huyện"
                           disabled={!formData.city}
                           className="h-11 rounded-xl"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label>Phường/Xã</Label>
                       <SearchableSelect 
                           options={wards.map(w => ({ value: w.name, label: w.name }))}
                           value={formData.ward}
                           onValueChange={(val) => setFormData(prev => ({ ...prev, ward: val }))}
                           placeholder="Chọn Phường/Xã"
                           disabled={!formData.district}
                           className="h-11 rounded-xl"
                       />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                       <Label htmlFor="note">Ghi chú</Label>
                       <Input id="note" name="note" value={formData.note} onChange={handleInputChange} placeholder="Ghi chú cho đơn hàng" />
                    </div>
                    <div className="sm:col-span-2 pt-2">
                       <div className="flex items-center space-x-2">
                         <input 
                            type="checkbox" 
                            id="isDefault" 
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                         />
                         <label htmlFor="isDefault" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                           Đặt làm địa chỉ mặc định
                         </label>
                       </div>
                    </div>
                    <div className="sm:col-span-2 mt-4">
                        <Button 
                            type="button"
                            onClick={handleConfirmManualAddress}
                            disabled={isCheckingFee}
                            className={`w-full sm:w-auto h-11 px-8 rounded-xl font-bold transition-all ${
                                isAddressConfirmed 
                                ? 'bg-accent/10 border-accent text-accent hover:bg-accent/20' 
                                : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                        >
                            {isCheckingFee ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang kiểm tra...
                                </span>
                            ) : isAddressConfirmed ? (
                                <span className="flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    Đã xác nhận địa chỉ
                                </span>
                            ) : (
                                "Xác nhận địa chỉ & Tính phí ship"
                            )}
                        </Button>
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
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'vnpay'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <RadioGroupItem value="vnpay" id="vnpay" />
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center p-1.5 grayscale-0">
                      <img 
                        src={vnpayLogo} 
                        alt="VNPay" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Chuyển khoản qua VNPay</p>
                      <p className="text-sm text-muted-foreground">Thanh toán qua cổng VNPAY-QR hoặc Ứng dụng ngân hàng</p>
                    </div>
                    {paymentMethod === 'vnpay' && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </label>

                  <label
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'payos'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <RadioGroupItem value="payos" id="payos" />
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center p-1.5">
                      <img 
                        src={payosLogo} 
                        alt="PayOS" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Cổng thanh toán PayOS</p>
                      <p className="text-sm text-muted-foreground">Thanh toán qua QR-Code ngân hàng (VietQR)</p>
                    </div>
                    {paymentMethod === 'payos' && (
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
                              {item.variantAttributes.map((attr, i) => {
                                const name = attr.name || (attr as any).attributeName;
                                const value = attr.attributeValue || (attr as any).value || (attr as any).attributeValue;
                                if (!name && !value) return null;
                                return (
                                  <span key={i} className="text-[10px] text-muted-foreground font-bold bg-secondary/50 px-2 py-0.5 rounded-md border border-border/30">
                                    {name}: {value}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                          <p className="text-sm font-semibold whitespace-nowrap">
                            {formatPrice(price * item.quantity)}
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
                        <Tabs defaultValue="mine" className="w-full">
                          <div className="px-4 pt-2">
                             <TabsList className="w-full grid grid-cols-2 h-10 p-1 bg-muted/50 rounded-xl">
                               <TabsTrigger value="mine" className="rounded-lg text-xs font-bold uppercase tracking-tight">Mã của bạn</TabsTrigger>
                               <TabsTrigger value="collect" className="rounded-lg text-xs font-bold uppercase tracking-tight">Sưu tầm thêm</TabsTrigger>
                             </TabsList>
                          </div>

                          <TabsContent value="mine" className="outline-none">
                            <ScrollArea className="max-h-[45vh] p-4">
                              {isVoucherLoading ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                  <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                                  <p className="text-sm text-muted-foreground">Đang tải...</p>
                                </div>
                              ) : userCoupons.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                  <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                  <p className="text-sm font-bold">Bạn chưa có mã giảm giá nào</p>
                                  <p className="text-xs text-muted-foreground mt-1">Hãy sang tab Sưu tầm để lấy ngay!</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
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
                                           <div className="font-black text-xs">{vc.coupon.type === 'PERCENT' ? `${vc.coupon.discountValue}%` : 'VNĐ'}</div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-sm line-clamp-1">{vc.coupon.name}</p>
                                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Mã: {vc.coupon.code}</p>
                                          {!isApplicable && (
                                            <p className="text-[10px] text-destructive mt-1 font-bold italic">
                                              Thiếu {formatPrice(vc.coupon.minOrderValue - selectedTotal)} để áp dụng
                                            </p>
                                          )}
                                        </div>
                                        {appliedCoupon?.id === vc.coupon.id && (
                                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-white" />
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </ScrollArea>
                          </TabsContent>

                          <TabsContent value="collect" className="outline-none">
                             <ScrollArea className="max-h-[45vh] p-4">
                              {isVoucherLoading ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                  <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                                  <p className="text-sm text-muted-foreground">Đang tải...</p>
                                </div>
                              ) : availableCoupons.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                  <Gift className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                  <p className="text-sm font-bold">Hết sạch mã rồi!</p>
                                  <p className="text-xs text-muted-foreground mt-1">Quay lại sau bạn nhé.</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {availableCoupons.map((c) => (
                                    <div
                                      key={c.id}
                                      className="w-full p-4 border border-border rounded-xl flex items-center gap-4 bg-muted/20"
                                    >
                                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                         <Gift className="w-6 h-6" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm line-clamp-1">{c.name}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Giảm {c.type === 'PERCENT' ? `${c.discountValue}%` : `${formatPrice(c.discountValue)}`}</p>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        className="h-8 text-[11px] font-bold px-3 rounded-lg"
                                        onClick={() => handleCollectVoucher(c.id)}
                                        disabled={isCollecting === c.id}
                                      >
                                        {isCollecting === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Lưu mã"}
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </TabsContent>
                        </Tabs>
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
                        <p className="text-sm font-bold text-primary">-{formatPrice(discountAmount)}</p>
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
                    <span>{formatPrice(selectedTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className={hasFreeShipping ? 'text-accent' : ''}>
                      {isLoadingFee ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground italic">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Đang tính...
                        </span>
                      ) : hasFreeShipping ? 'Miễn phí' : `${formatPrice(shippingFee)}`}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-primary font-medium">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        Giảm giá voucher
                      </span>
                      <span>-{formatPrice(discountAmount)}</span>
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
                  <span className="text-2xl font-bold text-primary">{formatPrice(totalAmount)}</span>
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
                    `Đặt hàng • ${formatPrice(totalAmount)}`
                  )}
                </button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Bằng việc đặt hàng, bận đồng ý với{' '}
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
