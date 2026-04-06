import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Index from "../pages/Index";
import ProductDetail from "../pages/ProductDetail";
import Login from "../pages/Login";
import Register from "../pages/Register";
import SearchResults from "../pages/SearchResult";
import Checkout from "../pages/Checkout";
import Account from "../pages/Account";
import Orders from "../pages/Orders";
import Category from "../pages/Category";
import Chat from "../pages/Chat";
import NotFound from "../pages/NotFound";
import FlashSalePage from "../pages/FlashSale";

import AdminLayout from "../components/admin/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import ProductsManagement from "../pages/admin/ProductManagement";
import CategoriesManagement from "../pages/admin/CategoriesManagement";
import AttributesManagement from "../pages/admin/AttributesManagement";
import OrdersManagement from "../pages/admin/OrdersManagement";
import UsersManagement from "../pages/admin/UsersManagement";
import PromotionsManagement from "../pages/admin/PromotionsManagement";
import CouponsManagement from "../pages/admin/CouponsManagement";
import Statistics from "../pages/admin/Statistics";
import ProductDetailManagement from "../pages/admin/ProductDetailManagement";
import BrandsManagement from "../pages/admin/BrandsManagement";
import BannersManagement from "../pages/admin/BannersManagement";
import ChatManagement from "../pages/admin/ChatManagement";

import ProtectedRoute from "../routes/ProtectedRoute";
import AdminRoute from "../routes/AdminRoute";

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* User Routes with Animations */}
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/flash-sale" element={<ProtectedRoute><PageTransition><FlashSalePage /></PageTransition></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><PageTransition><SearchResults /></PageTransition></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><PageTransition><Chat /></PageTransition></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><PageTransition><Checkout /></PageTransition></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><PageTransition><Account /></PageTransition></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><PageTransition><Orders /></PageTransition></ProtectedRoute>} />
        <Route path="/category/:slug" element={<ProtectedRoute><PageTransition><Category /></PageTransition></ProtectedRoute>} />
        <Route path="/brands" element={<ProtectedRoute><PageTransition><Category /></PageTransition></ProtectedRoute>} />
        
        {/* Admin Routes without PageTransition wrappers */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="categories" element={<CategoriesManagement />} />
            <Route path="attributes" element={<AttributesManagement />} />
            <Route path="banners" element={<BannersManagement />} />
            <Route path="brands" element={<BrandsManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="promotions" element={<PromotionsManagement />} />
            <Route path="coupons" element={<CouponsManagement />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="product-detail" element={<ProductDetailManagement />} />
            <Route path="chat" element={<ChatManagement />} />
          </Route>
        </Route>

        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
