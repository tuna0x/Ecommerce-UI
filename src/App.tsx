import { lazy, Suspense } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PermissionProvider } from "./context/PermissionContext";
import { ThemeProvider } from "./context/ThemeContext";
import { QuickViewProvider } from "./context/QuickViewContext";
import { WishlistProvider } from "./context/WishlistContext";
import { PersonalizationProvider } from "./context/PersonalizationContext";

import ScrollToTop from "./components/ScrollToTop";
import AnimatedRoutes from "./routes/AnimatedRoutes";

const queryClient = new QueryClient();
const RealtimeProviders = lazy(() => import("./context/RealtimeProviders"));

function AppProviders({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <RealtimeProviders>{children}</RealtimeProviders>
    </Suspense>
  );
}

function App() {
  // useEffect(()=>{
  //   const handleUnauthorized = ()=>{
  //     native
  //   }
  // })
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <ScrollToTop />
          <AuthProvider>
            <PermissionProvider>
              <AppProviders>
                <CartProvider>
                  <WishlistProvider>
                    <PersonalizationProvider>
                      <QuickViewProvider>
                        <TooltipProvider>
                          <Toaster />
                          <Sonner />
                          <AnimatedRoutes />
                        </TooltipProvider>
                      </QuickViewProvider>
                    </PersonalizationProvider>
                  </WishlistProvider>
                </CartProvider>
              </AppProviders>
            </PermissionProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
