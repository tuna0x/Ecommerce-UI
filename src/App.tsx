import Index from "./pages/Index";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { useEffect } from "react";

import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SearchResults from "./pages/SearchResult";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import Category from "./pages/Category";

import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProductsManagement from "./pages/admin/ProductManagement";
import CategoriesManagement from "./pages/admin/CategoriesManagement";
import AttributesManagement from "./pages/admin/AttributesManagement";
import OrdersManagement from "./pages/admin/OrdersManagement";
import UsersManagement from "./pages/admin/UsersManagement";
import PromotionsManagement from "./pages/admin/PromotionsManagement";
import CouponsManagement from "./pages/admin/CouponsManagement";
import Statistics from "./pages/admin/Statistics";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

const queryClient = new QueryClient();
function App() {
  // useEffect(()=>{
  //   const handleUnauthorized = ()=>{
  //     native
  //   }
  // })
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/search" element={<SearchResults />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <Account />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route path="/category/:slug" element={<Category />} />
                <Route path="/flash-sale" element={<Category />} />
                <Route path="/brands" element={<Category />} />

                <Route path="/admin" element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<ProductsManagement />} />
                    <Route
                      path="categories"
                      element={<CategoriesManagement />}
                    />
                    <Route
                      path="attributes"
                      element={<AttributesManagement />}
                    />
                    <Route path="orders" element={<OrdersManagement />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route
                      path="promotions"
                      element={<PromotionsManagement />}
                    />
                    <Route path="coupons" element={<CouponsManagement />} />
                    <Route path="statistics" element={<Statistics />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
