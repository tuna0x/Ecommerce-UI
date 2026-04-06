import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { IProduct, IVariantAttribute } from "../types/product.type";
import { useAuth } from "./AuthContext";
import { addToCartApi, getCartApi, removeCartItemApi, updateCartItemQuantityApi } from "../service/cartService";
import type { ICartItemResponse } from "../types/cart.type";
import { toast } from "sonner";

export interface CartItem extends IProduct {
    cartItemId: string; // Unique ID: v-{variantId} or p-{productId}
    dbItemId?: number; // Backend database ID for the CartItem
    quantity: number;
    selected: boolean;
    variantId?: number | null;
    variantAttributes?: IVariantAttribute[] | null;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: IProduct, variantId?: number | null, variantAttributes?: IVariantAttribute[] | null, quantity?: number) => void;
    removeFromCart: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    toggleSelectItem: (cartItemId: string) => void;
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
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 500000;

const getInitialCart = (): CartItem[] => {
    const savedCart = localStorage.getItem("beautylux_cart");
    if (savedCart) {
        try {
            return JSON.parse(savedCart);
        } catch (error) {
            console.error("Failed to parse cart", error);
        }
    }
    return [];
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { isAuthenticated } = useAuth();
    const [cartItems, setCartItems] = useState<CartItem[]>(getInitialCart);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const hasSyncedRef = React.useRef(false);
    const updateTimeoutsRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // Function to map DB item to CartItem interface
    const mapDbItemToCartItem = useCallback((item: ICartItemResponse): CartItem => {
        const cartItemId = item.variantId ? `v-${item.variantId}` : `p-${item.product.id}`;
        return {
            ...item.product,
            id: item.product.id,
            name: item.product.name,
            finalPrice: item.unitPrice,
            cartItemId,
            dbItemId: item.id,
            quantity: item.quantity,
            selected: true,
            variantId: item.variantId,
            variantAttributes: item.variantAttributes
        };
    }, []);

    // Initial Fetch & Sync
    useEffect(() => {
        const syncAndFetch = async () => {
            if (!isAuthenticated) {
                hasSyncedRef.current = false;
                return;
            }

            if (hasSyncedRef.current) return;

            setIsLoading(true);
            try {
                // 1. Fetch current DB cart
                const res = await getCartApi();
                let currentDbItems = res.data?.data?.item || [];

                // 2. Sync local items if any
                const localItems = getInitialCart().filter(li => !currentDbItems.some((di: ICartItemResponse) => 
                    (li.variantId ? li.variantId === di.variantId : li.id === di.product.id)
                ));

                if (localItems.length > 0) {
                    for (const item of localItems) {
                        try {
                            await addToCartApi(item.id, item.quantity, item.variantId);
                        } catch (e) {
                            console.error("Sync failed for", item.name, e);
                        }
                    }
                    // Re-fetch after sync
                    const finalRes = await getCartApi();
                    currentDbItems = finalRes.data?.data?.item || [];
                }

                // BUGFIX: Clear local cart to prevent deleted legacy items from resurrecting on refresh
                localStorage.removeItem("beautylux_cart");

                const mappedItems = currentDbItems.map(mapDbItemToCartItem);
                setCartItems(mappedItems);
                hasSyncedRef.current = true;
            } catch (error) {
                console.error("Cart sync failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        syncAndFetch();
    }, [isAuthenticated, mapDbItemToCartItem]);

    // Persist to localStorage (as backup/guest cart)
    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem("beautylux_cart", JSON.stringify(cartItems));
        }
    }, [cartItems, isAuthenticated]);

    const addToCart = async (product: IProduct, variantId: number | null = null, variantAttributes: IVariantAttribute[] | null = null, quantity: number = 1) => {
        const cartItemId = variantId ? `v-${variantId}` : `p-${product.id}`;

        if (isAuthenticated) {
            try {
                setIsLoading(true);
                await addToCartApi(product.id, quantity, variantId);
                const res = await getCartApi();
                if (res.data?.data?.item) {
                    setCartItems(res.data.data.item.map(mapDbItemToCartItem));
                }
                toast.success("Đã thêm sản phẩm vào giỏ hàng");
            } catch (err) {
                console.error("API addToCart failed", err);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                toast.error((err as any)?.response?.data?.message || "Thêm vào giỏ hàng thất bại. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
        } else {
            setCartItems((prev) => {
                const existingItem = prev.find((item) => item.cartItemId === cartItemId);
                if (existingItem) {
                    return prev.map((item) =>
                        item.cartItemId === cartItemId
                            ? { ...item, quantity: item.quantity + quantity }
                            : item,
                    );
                }
                return [...prev, { ...product, cartItemId, quantity, selected: true, variantId, variantAttributes }];
            });
        }

        setIsCartOpen(true);
    };

    const removeFromCart = async (cartItemId: string) => {
        const itemToRemove = cartItems.find(item => item.cartItemId === cartItemId);

        setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));

        if (isAuthenticated && itemToRemove?.dbItemId) {
            try {
                setIsLoading(true);
                await removeCartItemApi(itemToRemove.dbItemId);
                const res = await getCartApi();
                if (res.data?.data?.item) {
                    setCartItems(res.data.data.item.map(mapDbItemToCartItem));
                }
            } catch (err) {
                console.error("API removeFromCart failed", err);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                toast.error((err as any)?.response?.data?.message || "Xóa sản phẩm thất bại.");
                // Revert local state delete if API fails
                if (itemToRemove) {
                    setCartItems((prev) => [...prev, itemToRemove]);
                }
            } finally {
                setIsLoading(false);
            }
        }
    };

    const updateQuantity = async (cartItemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(cartItemId);
            return;
        }

        const itemToUpdate = cartItems.find(item => item.cartItemId === cartItemId);

        // 1. Optimistic UI update for instant feedback
        setCartItems((prev) =>
            prev.map((item) =>
                item.cartItemId === cartItemId ? { ...item, quantity } : item,
            ),
        );

        // 2. Debounced backend API sync
        const targetDbId = itemToUpdate?.dbItemId;
        if (isAuthenticated && targetDbId !== undefined) {
            if (updateTimeoutsRef.current[cartItemId]) {
                clearTimeout(updateTimeoutsRef.current[cartItemId]);
            }

            updateTimeoutsRef.current[cartItemId] = setTimeout(async () => {
                try {
                    await updateCartItemQuantityApi(targetDbId, quantity);
                    // Silently refresh backend state
                    const res = await getCartApi();
                    if (res.data?.data?.item) {
                        setCartItems(res.data.data.item.map(mapDbItemToCartItem));
                    }
                } catch (err: unknown) {
                    console.error("API updateQuantity failed", err);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    toast.error((err as any)?.response?.data?.message || "Cập nhật số lượng thất bại.");
                    // Revert by refetching known true state
                    const res = await getCartApi();
                    if (res.data?.data?.item) {
                        setCartItems(res.data.data.item.map(mapDbItemToCartItem));
                    }
                }
            }, 600); // 600ms delay debouncing
        }
    };

    const toggleSelectItem = (cartItemId: string) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.cartItemId === cartItemId ? { ...item, selected: !item.selected } : item,
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

    const getPrice = (item: IProduct) => item.finalPrice || item.price || 0;

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce(
        (sum, item) => sum + getPrice(item) * item.quantity,
        0,
    );

    const selectedItems = cartItems.filter((item) => item.selected);
    const selectedCount = selectedItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
    );
    const selectedTotal = selectedItems.reduce(
        (sum, item) => sum + getPrice(item) * item.quantity,
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
                isLoading,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};

export { FREE_SHIPPING_THRESHOLD };
