import React, { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent | MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => { },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('BÔNGCOSMETIC-theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('BÔNGCOSMETIC-theme', theme);
  }, [theme]);

  const toggleTheme = (event?: React.MouseEvent | MouseEvent) => {
    // Check if the browser supports View Transitions API
    const isAppearanceTransition =
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isAppearanceTransition) {
      setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
      return;
    }

    // Default to viewport center if click coordinates are missing
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const root = document.documentElement;
    root.style.setProperty('--x', `${x}px`);
    root.style.setProperty('--y', `${y}px`);
    root.style.setProperty('--r', `${endRadius}px`);

    const nextTheme = theme === 'light' ? 'dark' : 'light';

    document.startViewTransition(() => {
      flushSync(() => {
        // Update DOM class synchronously inside the transition callback
        root.classList.remove('light', 'dark');
        root.classList.add(nextTheme);
        
        setTheme(nextTheme);
      });
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
