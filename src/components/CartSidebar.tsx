import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Truck,
  ArrowRight,
  Check,
} from "lucide-react";
import { useCart, FREE_SHIPPING_THRESHOLD } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { Checkbox } from "../components/ui/Checkbox";

const CartSidebar: React.FC = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    toggleSelectItem,
    selectAllItems,
    selectedTotal,
    selectedCount,
    cartCount,
    isCartOpen,
    setIsCartOpen,
  } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const amountToFreeShip = FREE_SHIPPING_THRESHOLD - selectedTotal;
  const hasFreeShipping = selectedTotal >= FREE_SHIPPING_THRESHOLD;
  const freeShipProgress = Math.min(
    (selectedTotal / FREE_SHIPPING_THRESHOLD) * 100,
    100,
  );

  const allSelected =
    cartItems.length > 0 && cartItems.every((item) => item.selected);
  const someSelected = cartItems.some((item) => item.selected);

  const handleCheckout = () => {
    if (selectedCount > 0) {
      setIsCartOpen(false);
      navigate("/checkout");
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Giỏ hàng của bạn</h2>
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                  {cartCount}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select All & Free Shipping Banner */}
            {cartItems.length > 0 && (
              <div className="px-5 py-4 bg-accent/10 border-b border-border space-y-3">
                {/* Select All */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) =>
                        selectAllItems(checked as boolean)
                      }
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm font-medium">
                      Chọn tất cả ({cartItems.length} sản phẩm)
                    </span>
                  </label>
                  {someSelected && (
                    <span className="text-xs text-muted-foreground">
                      Đã chọn: {selectedCount}
                    </span>
                  )}
                </div>

                {/* Free Shipping */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-accent" />
                    {hasFreeShipping ? (
                      <span className="text-sm font-medium text-accent">
                        🎉 Bạn đã được miễn phí vận chuyển!
                      </span>
                    ) : selectedTotal > 0 ? (
                      <span className="text-sm">
                        Mua thêm{" "}
                        <span className="font-bold text-primary">
                          {formatPrice(amountToFreeShip)}₫
                        </span>{" "}
                        để được{" "}
                        <span className="font-medium text-accent">
                          Freeship
                        </span>
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Chọn sản phẩm để xem điều kiện freeship
                      </span>
                    )}
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${freeShipProgress}%` }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg font-semibold mb-2">Giỏ hàng trống</p>
                  <p className="text-muted-foreground text-sm mb-6">
                    Hãy thêm sản phẩm yêu thích vào giỏ hàng
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="btn-primary"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group relative bg-card border rounded-2xl p-4 hover:shadow-md transition-all duration-300 ${
                        item.selected
                          ? "border-primary/50 bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Checkbox */}
                        <div className="flex items-start pt-1">
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={() => toggleSelectItem(item.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </div>

                        {/* Product Image */}
                        <Link
                          to={`/product/${item.id}`}
                          onClick={() => setIsCartOpen(false)}
                          className="relative w-20 h-20 bg-secondary/50 rounded-xl overflow-hidden flex-shrink-0"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Discount Badge */}
                          {item.discount && item.discount > 0 && (
                            <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              -{item.discount}%
                            </span>
                          )}
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          {/* Brand */}
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            {item.brand}
                          </span>

                          {/* Name */}
                          <Link
                            to={`/product/${item.id}`}
                            onClick={() => setIsCartOpen(false)}
                            className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors mt-0.5"
                          >
                            {item.name}
                          </Link>

                          {/* Price */}
                          <div className="flex items-center gap-2 mt-auto pt-1">
                            <span className="text-primary font-bold text-sm">
                              {formatPrice(item.price)}₫
                            </span>
                            {item.originalPrice &&
                              item.originalPrice > item.price && (
                                <span className="text-[11px] text-muted-foreground line-through">
                                  {formatPrice(item.originalPrice)}₫
                                </span>
                              )}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="absolute top-3 right-3 p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Bottom Section: Quantity & Subtotal */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 ml-8">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground mr-2">
                            Số lượng:
                          </span>
                          <div className="flex items-center border border-border rounded-lg bg-background">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="p-1.5 hover:bg-secondary transition-colors rounded-l-lg disabled:opacity-50"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="p-1.5 hover:bg-secondary transition-colors rounded-r-lg"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Item Subtotal */}
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">
                            Thành tiền:
                          </span>
                          <p className="font-bold text-foreground text-sm">
                            {formatPrice(item.price * item.quantity)}₫
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-border bg-background">
                {/* Subtotal */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Sản phẩm đã chọn
                    </span>
                    <span className="font-medium">
                      {selectedCount} sản phẩm
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-medium">
                      {formatPrice(selectedTotal)}₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Phí vận chuyển
                    </span>
                    <span
                      className={`font-medium ${hasFreeShipping ? "text-accent" : ""}`}
                    >
                      {selectedTotal === 0
                        ? "—"
                        : hasFreeShipping
                          ? "Miễn phí"
                          : "Tính ở bước tiếp theo"}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between py-4 border-t border-border mb-4">
                  <span className="text-lg font-bold">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(selectedTotal)}₫
                  </span>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={selectedCount === 0}
                  className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedCount === 0 ? (
                    "Chọn sản phẩm để thanh toán"
                  ) : (
                    <>
                      Thanh toán ({selectedCount})
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full mt-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
