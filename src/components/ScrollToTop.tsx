import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Global component that resets the scroll position to the top of the page
 * whenever the route (pathname) changes. This is essential for a consistent
 * user experience in single-page applications.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to the top of the document on route change
    // Using a microtask to ensure it runs after the route has settled
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
      // Also fallback for specifically targeting elements if window.scrollTo is fickle
      document.documentElement.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
    };

    // Run immediately
    scrollToTop();

    // Small delay for mobile browsers and pages with transitions
    const timeoutId = setTimeout(scrollToTop, 10);
    
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
