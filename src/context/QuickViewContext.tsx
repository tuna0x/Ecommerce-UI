import React, { createContext, useContext, useState } from 'react';
import type { IProduct } from '../types/product.type';
import QuickView from '../components/QuickView';

interface QuickViewContextType {
  openQuickView: (product: IProduct) => void;
}

const QuickViewContext = createContext<QuickViewContextType>({
  openQuickView: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useQuickView = () => useContext(QuickViewContext);

export const QuickViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [product, setProduct] = useState<IProduct | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openQuickView = (p: IProduct) => {
    setProduct(p);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setProduct(null), 300);
  };

  return (
    <QuickViewContext.Provider value={{ openQuickView }}>
      {children}
      <QuickView product={product} isOpen={isOpen} onClose={handleClose} />
    </QuickViewContext.Provider>
  );
};
