import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { IProduct, IVariantAttribute } from "../types/product.type";
import { useAuth } from "./AuthContext";
import { addToCartApi, getCartApi, removeCartItemApi, updateCartItemQuantityApi } from "../service/cartService";
import type { ICartItemResponse } from "../types/cart.type";
import { toast } from "sonner";
import { logActivity } from "../service/trackingService";

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
    removeSelectedItems: () => Promise<void>;
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

const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as { response?: { data?: { message?: unknown } } }).response;
        if (typeof response?.data?.message === "string") {
            return response.data.message;
        }
    }
    return fallback;
};

const getInitialCart = (): CartItem[] => {
    const savedCart = localStorage.getItem("BÔNGCOSMETIC_cart");
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
            stock: item.product.stock, // Now reliably provided by backend
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
        const fetchCartFromDb = async () => {
            if (!isAuthenticated) {
                hasSyncedRef.current = false;
                return;
            }

            if (hasSyncedRef.current) return;

            setIsLoading(true);
            try {
                // BUGFIX: Clear local cart immediately to ensure we only use DB data
                localStorage.removeItem("BÔNGCOSMETIC_cart");

                // Fetch current DB cart
                const res = await getCartApi();
                const currentDbItems = res.data?.data?.item || [];

                const mappedItems = currentDbItems.map(mapDbItemToCartItem);
                setCartItems(mappedItems);
                hasSyncedRef.current = true;
            } catch (error) {
                console.error("Cart fetch failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCartFromDb();
    }, [isAuthenticated, mapDbItemToCartItem]);

    // Persist to localStorage (as backup/guest cart)
    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem("BÔNGCOSMETIC_cart", JSON.stringify(cartItems));
        }
    }, [cartItems, isAuthenticated]);

    const addToCart = async (product: IProduct, variantId: number | null = null, variantAttributes: IVariantAttribute[] | null = null, quantity: number = 1) => {
        const cartItemId = variantId ? `v-${variantId}` : `p-${product.id}`;

        // Stock validation
        let availableStock = product.stock;
        if (variantId && product.variants) {
            const variant = product.variants.find(v => v.id === variantId);
            if (variant) availableStock = variant.stock;
        }

        const existingItem = cartItems.find(item => item.cartItemId === cartItemId);
        const totalPendingQuantity = (existingItem?.quantity || 0) + quantity;

        if (totalPendingQuantity > availableStock) {
            const remaining = availableStock - (existingItem?.quantity || 0);
            if (remaining <= 0) {
                toast.error(`Sản phẩm này đã đạt giới hạn tồn kho (${availableStock} sản phẩm).`);
            } else {
                toast.warning(`Bạn chỉ có thể thêm tối đa ${remaining} sản phẩm này vào giỏ hàng.`);
            }
            return;
        }

        logActivity('ADD_CART', {
            productId: product.id,
            productName: product.name,
            quantity,
            price: product.finalPrice || product.price || 0
        });

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
                toast.error(getApiErrorMessage(err, "Thêm vào giỏ hàng thất bại. Vui lòng thử lại."));
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
                return [...prev, { ...product, stock: availableStock, cartItemId, quantity, selected: true, variantId, variantAttributes }];
            });
            toast.success("Đã thêm sản phẩm vào giỏ hàng");
        }

        setIsCartOpen(true);
    };

    const removeFromCart = async (cartItemId: string) => {
        const itemToRemove = cartItems.find(item => item.cartItemId === cartItemId);
        if (itemToRemove) {
            logActivity('REMOVE_CART', {
                productId: itemToRemove.id,
                productName: itemToRemove.name,
                quantity: itemToRemove.quantity
            });
        }

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
                toast.error(getApiErrorMessage(err, "Xóa sản phẩm thất bại."));
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
        if (!itemToUpdate) return;

        // Stock validation
        if (quantity > itemToUpdate.stock) {
            toast.warning(`Số lượng tối đa trong kho là ${itemToUpdate.stock} sản phẩm.`);
            return;
        }

        logActivity('UPDATE_CART', {
            productId: itemToUpdate.id,
            productName: itemToUpdate.name,
            oldQuantity: itemToUpdate.quantity,
            newQuantity: quantity
        });

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
                    
                    // Remove self from timeouts AFTER successful API call
                    delete updateTimeoutsRef.current[cartItemId];

                    // Only refresh backend state if NO OTHER items are currently pending sync
                    // This prevents overwriting other optimistic updates that haven't hit the DB yet
                    if (Object.keys(updateTimeoutsRef.current).length === 0) {
                        const res = await getCartApi();
                        if (res.data?.data?.item) {
                            setCartItems(res.data.data.item.map(mapDbItemToCartItem));
                        }
                    }
                } catch (err: unknown) {
                    console.error("API updateQuantity failed", err);
                    delete updateTimeoutsRef.current[cartItemId];
                toast.error(getApiErrorMessage(err, "Cập nhật số lượng thất bại."));
                    
                    // On failure, ALWAYS refetch to revert to the true backend state
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

    const removeSelectedItems = async () => {
        const itemsToRemove = cartItems.filter(item => item.selected);
        if (itemsToRemove.length === 0) return;

        // Log activity
        itemsToRemove.forEach(item => {
            logActivity('REMOVE_CART', {
                productId: item.id,
                productName: item.name,
                quantity: item.quantity
            });
        });

        // Optimistic UI update
        setCartItems(prev => prev.filter(item => !item.selected));

        if (isAuthenticated) {
            try {
                setIsLoading(true);
                // Remove all selected items from backend
                const dbIdsToRemove = itemsToRemove
                    .filter(item => item.dbItemId !== undefined)
                    .map(item => item.dbItemId!);

                await Promise.all(dbIdsToRemove.map(id => removeCartItemApi(id)));

                // Refresh from backend
                const res = await getCartApi();
                if (res.data?.data?.item) {
                    setCartItems(res.data.data.item.map(mapDbItemToCartItem));
                }
                toast.success(`Đã xóa ${itemsToRemove.length} sản phẩm khỏi giỏ hàng`);
            } catch (err) {
                console.error("API removeSelectedItems failed", err);
                toast.error(getApiErrorMessage(err, "Xóa sản phẩm thất bại."));
                // Revert on failure
                setCartItems(prev => [...prev, ...itemsToRemove]);
            } finally {
                setIsLoading(false);
            }
        } else {
            toast.success(`Đã xóa ${itemsToRemove.length} sản phẩm khỏi giỏ hàng`);
        }
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
                removeSelectedItems,
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



