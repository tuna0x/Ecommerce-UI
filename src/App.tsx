import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ChatProvider } from "./context/ChatContext";
import { ThemeProvider } from "./context/ThemeContext";
import { QuickViewProvider } from "./context/QuickViewContext";
import { SocketProvider } from "./context/SocketContext";

import AnimatedRoutes from "./routes/AnimatedRoutes";

const queryClient = new QueryClient();
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
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <ChatProvider>
                  <CartProvider>
                    <QuickViewProvider>
                      <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        <AnimatedRoutes />
                      </TooltipProvider>
                    </QuickViewProvider>
                  </CartProvider>
                </ChatProvider>
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
