import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { IProduct, IVariantAttribute } from "../types/product.type";
import { useAuth } from "./AuthContext";
import { addToCartApi, getCartApi, removeCartItemApi, updateCartItemQuantityApi } from "../service/cartService";
import type { ICartItemResponse, ICartResponse } from "../types/cart.type";
import type { IApiResponse } from "../types/api.type";

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
    const [isSyncing, setIsSyncing] = useState(false);

    // Initial Fetch from DB if authenticated
    useEffect(() => {
        if (isAuthenticated && !isSyncing) {
            const fetchCart = async () => {
                try {
                    const res = (await getCartApi()).data as IApiResponse<ICartResponse>;
                    if (res?.data?.item) {
                        const dbItems: CartItem[] = res.data.item.map((item: ICartItemResponse) => {
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
                        });

                        // Merge or overwrite? Let's overwrite for now if DB is primary
                        setCartItems(dbItems);
                    }
                } catch (error) {
                    console.error("Failed to fetch cart from DB", error);
                }
            };
            fetchCart();
        }
    }, [isAuthenticated, isSyncing]);

    // Simple Sync local items to DB on login
    useEffect(() => {
        const syncLocalCart = async () => {
            if (isAuthenticated && cartItems.length > 0 && !isSyncing) {
                // If any item doesn't have a dbItemId, it's local only
                const localItems = cartItems.filter(item => !item.dbItemId);
                if (localItems.length > 0) {
                    setIsSyncing(true);
                    for (const item of localItems) {
                        try {
                            await addToCartApi(item.id, item.quantity, item.variantId);
                        } catch (err) {
                            console.error("Failed to sync local item", (item as any).name);
                        }
                    }
                    // Re-fetch full cart from DB after sync
                    const res = (await getCartApi()).data as IApiResponse<ICartResponse>;
                    if (res?.data?.item) {
                        const dbItems: CartItem[] = res.data.item.map((item: ICartItemResponse) => {
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
                        });
                        setCartItems(dbItems);
                    }
                    setIsSyncing(false);
                }
            }
        };
        syncLocalCart();
    }, [isAuthenticated, cartItems, isSyncing]);

    // Save cart to localStorage fall-back
    useEffect(() => {
        localStorage.setItem("beautylux_cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = async (product: IProduct, variantId: number | null = null, variantAttributes: IVariantAttribute[] | null = null, quantity: number = 1) => {
        const cartItemId = variantId ? `v-${variantId}` : `p-${product.id}`;

        // 2. Local State Update
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

        // 3. API Sync if logged in
        if (isAuthenticated) {
            try {
                await addToCartApi(product.id, quantity, variantId);
                const res = await getCartApi();
                if (res?.data?.item) {
                    const dbItems: CartItem[] = res.data.item.map((item: any) => {
                        const cItemId = item.variantId ? `v-${item.variantId}` : `p-${item.product.id}`;
                        return {
                            ...item.product,
                            id: item.product.id,
                            name: item.product.name,
                            finalPrice: item.unitPrice,
                            cartItemId: cItemId,
                            dbItemId: item.id,
                            quantity: item.quantity,
                            selected: true,
                            variantId: item.variantId,
                            variantAttributes: item.variantAttributes
                        };
                    });
                    setCartItems(dbItems);
                }
            } catch (err) {
                console.error("API addToCart failed", err);
            }
        }

        setIsCartOpen(true);
    };

    const removeFromCart = async (cartItemId: string) => {
        const itemToRemove = cartItems.find(item => item.cartItemId === cartItemId);

        setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));

        if (isAuthenticated && itemToRemove?.dbItemId) {
            try {
                await removeCartItemApi(itemToRemove.dbItemId);
            } catch (err) {
                console.error("API removeFromCart failed", err);
            }
        }
    };

    const updateQuantity = async (cartItemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(cartItemId);
            return;
        }

        const itemToUpdate = cartItems.find(item => item.cartItemId === cartItemId);

        setCartItems((prev) =>
            prev.map((item) =>
                item.cartItemId === cartItemId ? { ...item, quantity } : item,
            ),
        );

        if (isAuthenticated && itemToUpdate?.dbItemId) {
            try {
                await updateCartItemQuantityApi(itemToUpdate.dbItemId, quantity);
            } catch (err) {
                console.error("API updateQuantity failed", err);
            }
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
