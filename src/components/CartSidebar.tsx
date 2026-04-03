import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Truck, ArrowRight } from 'lucide-react';
import { useCart, FREE_SHIPPING_THRESHOLD } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Checkbox } from '../components/ui/Checkbox';

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
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const amountToFreeShip = FREE_SHIPPING_THRESHOLD - selectedTotal;
  const hasFreeShipping = selectedTotal >= FREE_SHIPPING_THRESHOLD;
  const freeShipProgress = Math.min((selectedTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const allSelected = cartItems.length > 0 && cartItems.every((item) => item.selected);
  const someSelected = cartItems.some((item) => item.selected);

  const handleCheckout = () => {
    if (selectedCount > 0) {
      setIsCartOpen(false);
      navigate('/checkout');
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
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-background z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold tracking-tight">Giỏ hàng</h2>
                <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {cartCount}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Select All & Free Shipping */}
            {cartItems.length > 0 && (
              <div className="px-6 py-3.5 border-b border-border/40 space-y-3">
                {/* Select All */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => selectAllItems(checked as boolean)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4"
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      Chọn tất cả ({cartItems.length})
                    </span>
                  </label>
                  {someSelected && (
                    <span className="text-[11px] text-primary font-medium">
                      Đã chọn {selectedCount}
                    </span>
                  )}
                </div>

                {/* Free Shipping */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Truck className="w-3.5 h-3.5 text-accent" />
                    {hasFreeShipping ? (
                      <span className="text-xs font-medium text-accent">
                        🎉 Bạn đã được miễn phí vận chuyển!
                      </span>
                    ) : selectedTotal > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Mua thêm <span className="font-semibold text-primary">{formatPrice(amountToFreeShip)}₫</span> để <span className="font-medium text-accent">freeship</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Chọn sản phẩm để xem điều kiện freeship
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
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
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-5">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-base font-semibold mb-1.5">Giỏ hàng trống</p>
                  <p className="text-muted-foreground text-sm mb-6">
                    Hãy thêm sản phẩm yêu thích vào giỏ hàng
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="btn-primary text-sm px-6 py-2.5"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4 space-y-0">
                  {cartItems.map((item, index) => {
                    const price = item.finalPrice || item.price || 0;
                    const originalPrice = item.originalPrice || 0;
                    const discount = item.discount || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
                    const brandName = typeof item.brand === 'string' ? item.brand : item.brand.name;
                    const image = item.thumbnail || (Array.isArray(item.image) ? item.image[0] : (item.image ?? ''));

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className={`group relative py-4 ${index !== cartItems.length - 1 ? 'border-b border-border/30' : ''
                          }`}
                      >
                        <div className="flex gap-3">
                          {/* Checkbox */}
                          <div className="flex items-start pt-0.5">
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={() => toggleSelectItem(item.id)}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4"
                            />
                          </div>

                          {/* Product Image */}
                          <Link
                            to={`/product/${item.id}`}
                            onClick={() => setIsCartOpen(false)}
                            className="relative w-[68px] h-[68px] bg-secondary/40 rounded-xl overflow-hidden flex-shrink-0"
                          >
                            <img
                              src={image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {discount > 0 && (
                              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[8px] font-bold px-1 py-0.5 rounded">
                                -{discount}%
                              </span>
                            )}
                          </Link>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            {/* Brand */}
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                              {brandName}
                            </span>

                            {/* Name */}
                            <Link
                              to={`/product/${item.id}`}
                              onClick={() => setIsCartOpen(false)}
                              className="font-medium text-[13px] leading-tight line-clamp-2 hover:text-primary transition-colors"
                            >
                              {item.name}
                            </Link>

                            {/* Price */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-primary font-bold text-sm">
                                {formatPrice(price)}₫
                              </span>
                              {originalPrice > price && (
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {formatPrice(originalPrice)}₫
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="self-start p-1 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Quantity & Subtotal - Same horizontal line */}
                        <div className="flex items-center justify-between mt-2.5 ml-[26px] pl-[68px]">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-muted-foreground/60 hover:text-primary hover:bg-primary/5 rounded transition-colors disabled:opacity-30"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-semibold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-muted-foreground/60 hover:text-primary hover:bg-primary/5 rounded transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Subtotal */}
                          <span className="font-bold text-sm text-foreground">
                            {formatPrice(price * item.quantity)}₫
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="px-6 py-5 border-t border-border/60 bg-background">
                {/* Summary */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Đã chọn</span>
                    <span className="font-medium">{selectedCount} sản phẩm</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-medium">{formatPrice(selectedTotal)}₫</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className={`font-medium ${hasFreeShipping ? 'text-accent' : ''}`}>
                      {selectedTotal === 0 ? '—' : hasFreeShipping ? 'Miễn phí' : 'Tính sau'}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between py-3 border-t border-border/40 mb-4">
                  <span className="text-base font-bold tracking-tight">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary tracking-tight">{formatPrice(selectedTotal)}₫</span>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={selectedCount === 0}
                  className="w-full btn-primary py-3.5 text-sm font-semibold flex items-center justify-center gap-2 group shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {selectedCount === 0 ? (
                    'Chọn sản phẩm để thanh toán'
                  ) : (
                    <>
                      Thanh toán ({selectedCount})
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full mt-2 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
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
