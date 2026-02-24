import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Product } from "../data/products";

export interface CartItem extends Product {
  quantity: number;
  selected: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  toggleSelectItem: (productId: number) => void;
  selectAllItems: (selected: boolean) => void;
  clearCart: () => void;
  clearSelectedItems: () => void;
  cartCount: number;
  cartTotal: number;
  selectedTotal: number;
  selectedCount: number;
  selectedItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 500000;

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1, selected: true }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const toggleSelectItem = (productId: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const selectAllItems = (selected: boolean) => {
    setCartItems((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const clearSelectedItems = () => {
    setCartItems((prev) => prev.filter((item) => !item.selected));
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const selectedItems = cartItems.filter((item) => item.selected);
  const selectedCount = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const selectedTotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleSelectItem,
        selectAllItems,
        clearCart,
        clearSelectedItems,
        cartCount,
        cartTotal,
        selectedTotal,
        selectedCount,
        selectedItems,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export { FREE_SHIPPING_THRESHOLD };
