import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

export const PersonalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [recentlyViewed, setRecentlyViewed] = useState<IProduct[]>([]);
    const [preferredCategories, setPreferredCategories] = useState<Record<number, number>>({});

    // Load from localStorage on mount
    useEffect(() => {
        const savedRecent = localStorage.getItem(STORAGE_KEY_RECENT);
        const savedPrefs = localStorage.getItem(STORAGE_KEY_PREFS);

        if (savedRecent) {
            try {
                setRecentlyViewed(JSON.parse(savedRecent));
            } catch (e) {
                console.error("Failed to parse recently viewed products", e);
            }
        }

        if (savedPrefs) {
            try {
                setPreferredCategories(JSON.parse(savedPrefs));
            } catch (e) {
                console.error("Failed to parse preferred categories", e);
            }
        }
    }, []);

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

export const usePersonalization = () => {
    const context = useContext(PersonalizationContext);
    if (!context) {
        throw new Error('usePersonalization must be used within a PersonalizationProvider');
    }
    return context;
};
