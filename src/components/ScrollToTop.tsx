import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Global component that resets the scroll position to the top of the page
 * whenever the route (pathname) changes. This is essential for a consistent
 * user experience in single-page applications.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
