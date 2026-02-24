import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useCart, FREE_SHIPPING_THRESHOLD } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { toast } from "sonner";

const Checkout: React.FC = () => {
  const { selectedItems, selectedTotal, selectedCount, clearSelectedItems } =
    useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: "",
    email: user?.email || "",
    address: "",
    city: "",
    district: "",
    ward: "",
    note: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const hasFreeShipping = selectedTotal >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = hasFreeShipping ? 0 : 30000;
  const totalAmount = selectedTotal + shippingFee;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.address ||
      !formData.city
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Không có sản phẩm nào để thanh toán");
      return;
    }

    setIsSubmitting(true);

    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Clear selected items from cart
    clearSelectedItems();

    toast.success("Đặt hàng thành công! Cảm ơn bạn đã mua sắm.");
    navigate("/");

    setIsSubmitting(false);
  };

  if (selectedItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3">
            Không có sản phẩm để thanh toán
          </h1>
          <p className="text-muted-foreground mb-6">
            Vui lòng chọn sản phẩm trong giỏ hàng để tiến hành thanh toán.
          </p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Quay lại mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
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
                  <div>
                    <h2 className="font-bold text-lg">Thông tin giao hàng</h2>
                    <p className="text-sm text-muted-foreground">
                      Điền đầy đủ để chúng tôi giao hàng cho bạn
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và tên *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0912 345 678"
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Địa chỉ *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Số nhà, tên đường"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Tỉnh/Thành phố *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Hồ Chí Minh"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">Quận/Huyện</Label>
                    <Input
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="Quận 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ward">Phường/Xã</Label>
                    <Input
                      id="ward"
                      name="ward"
                      value={formData.ward}
                      onChange={handleInputChange}
                      placeholder="Phường Bến Nghé"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Ghi chú</Label>
                    <Input
                      id="note"
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      placeholder="Ghi chú cho đơn hàng"
                    />
                  </div>
                </div>
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
                    <h2 className="font-bold text-lg">
                      Phương thức thanh toán
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Chọn cách thanh toán phù hợp với bạn
                    </p>
                  </div>
                </div>

                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-3"
                >
                  <label
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === "cod"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="cod" id="cod" />
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        Thanh toán khi nhận hàng (COD)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Thanh toán bằng tiền mặt khi nhận hàng
                      </p>
                    </div>
                    {paymentMethod === "cod" && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </label>

                  <label
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === "banking"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="banking" id="banking" />
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Chuyển khoản ngân hàng</p>
                      <p className="text-sm text-muted-foreground">
                        Chuyển khoản qua tài khoản ngân hàng
                      </p>
                    </div>
                    {paymentMethod === "banking" && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </label>

                  <label
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === "momo"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="momo" id="momo" />
                    <div className="w-10 h-10 bg-[#A50064] rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Ví MoMo</p>
                      <p className="text-sm text-muted-foreground">
                        Thanh toán qua ví điện tử MoMo
                      </p>
                    </div>
                    {paymentMethod === "momo" && (
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
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.brand}
                        </p>
                      </div>
                      <p className="text-sm font-semibold whitespace-nowrap">
                        {formatPrice(item.price * item.quantity)}₫
                      </p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Mã giảm giá" className="pl-10" />
                  </div>
                  <button
                    type="button"
                    className="px-4 bg-secondary hover:bg-secondary/80 rounded-lg font-medium text-sm transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>

                {/* Summary */}
                <div className="space-y-3 py-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tạm tính ({selectedCount} sản phẩm)
                    </span>
                    <span>{formatPrice(selectedTotal)}₫</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Phí vận chuyển
                    </span>
                    <span className={hasFreeShipping ? "text-accent" : ""}>
                      {hasFreeShipping
                        ? "Miễn phí"
                        : `${formatPrice(shippingFee)}₫`}
                    </span>
                  </div>
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
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(totalAmount)}₫
                  </span>
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
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                      />
                      Đang xử lý...
                    </span>
                  ) : (
                    `Đặt hàng • ${formatPrice(totalAmount)}₫`
                  )}
                </button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Bằng việc đặt hàng, bạn đồng ý với{" "}
                  <a href="#" className="text-primary hover:underline">
                    Điều khoản sử dụng
                  </a>{" "}
                  và{" "}
                  <a href="#" className="text-primary hover:underline">
                    Chính sách bảo mật
                  </a>
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
