import React, { createContext, useContext, useState, useCallback } from 'react';
import type { IProduct } from '../types/product.type';

interface PersonalizationContextType {
    recentlyViewed: IProduct[];
    preferredCategories: Record<number, number>; // categoryId -> viewCount
    trackView: (product: IProduct) => void;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

const MAX_RECENT_ITEMS = 15;
const STORAGE_KEY_RECENT = 'personalization_recently_viewed';
const STORAGE_KEY_PREFS = 'personalization_preferred_categories';

const readStoredValue = <T,>(key: string, fallback: T): T => {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    try {
        return JSON.parse(saved) as T;
    } catch (e) {
        console.error(`Failed to parse ${key}`, e);
        return fallback;
    }
};

export const PersonalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [recentlyViewed, setRecentlyViewed] = useState<IProduct[]>(() =>
        readStoredValue<IProduct[]>(STORAGE_KEY_RECENT, [])
    );
    const [preferredCategories, setPreferredCategories] = useState<Record<number, number>>(() =>
        readStoredValue<Record<number, number>>(STORAGE_KEY_PREFS, {})
    );

    const trackView = useCallback((product: IProduct) => {
        // 1. Update Recently Viewed
        setRecentlyViewed(prev => {
            const filtered = prev.filter(p => p.id !== product.id);
            const updated = [product, ...filtered].slice(0, MAX_RECENT_ITEMS);
            localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
            return updated;
        });

        // 2. Update Preferred Categories
        const categoryId = typeof product.category === 'object' ? product.category.id : null;
        if (categoryId) {
            setPreferredCategories(prev => {
                const updated = {
                    ...prev,
                    [categoryId]: (prev[categoryId] || 0) + 1
                };
                localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(updated));
                return updated;
            });
        }
    }, []);

    return (
        <PersonalizationContext.Provider value={{ recentlyViewed, preferredCategories, trackView }}>
            {children}
        </PersonalizationContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePersonalization = () => {
    const context = useContext(PersonalizationContext);
    if (!context) {
        throw new Error('usePersonalization must be used within a PersonalizationProvider');
    }
    return context;
};
