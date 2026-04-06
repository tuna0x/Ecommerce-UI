import { Routes, Route } from "react-router-dom";

import Index from "../pages/Index";
import ProductDetail from "../pages/ProductDetail";
import Login from "../pages/Login";
import Register from "../pages/Register";
import SearchResults from "../pages/SearchResult";
import Checkout from "../pages/Checkout";
import PaymentResult from "../pages/PaymentResult";
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

const AnimatedRoutes = () => {
  return (
    <Routes>
      {/* User Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/flash-sale" element={<ProtectedRoute><FlashSalePage /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/payment-result" element={<ProtectedRoute><PaymentResult /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/category/:slug" element={<ProtectedRoute><Category /></ProtectedRoute>} />
      <Route path="/brands" element={<ProtectedRoute><Category /></ProtectedRoute>} />

      {/* Admin Routes */}
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

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AnimatedRoutes;
