import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { logActivity } from "../service/trackingService";
import UserLayout from "../components/layout/UserLayout";

// Lazy load all pages
const Index = lazy(() => import("../pages/Index"));
const ProductDetail = lazy(() => import("../pages/ProductDetail"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const SearchResults = lazy(() => import("../pages/SearchResult"));
const Checkout = lazy(() => import("../pages/Checkout"));
const PaymentResult = lazy(() => import("../pages/PaymentResult"));
const Account = lazy(() => import("../pages/Account"));
const Orders = lazy(() => import("../pages/Orders"));
const Category = lazy(() => import("../pages/Category"));
const Chat = lazy(() => import("../pages/Chat"));
const NotFound = lazy(() => import("../pages/NotFound"));
const FlashSalePage = lazy(() => import("../pages/FlashSale"));
const VoucherWallet = lazy(() => import("../pages/VoucherWallet"));
const Notification = lazy(() => import("../pages/Notifications"));
const Categories = lazy(() => import("../pages/Categories"));
const Wishlist = lazy(() => import("../pages/Wishlist"));
const BrandsPage = lazy(() => import("../pages/Brands"));
const PrivacyPolicy = lazy(() => import("../pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("../pages/TermsOfService"));

// Admin Components (Static layout can stay, but pages should be lazy)
import AdminLayout from "../components/admin/AdminLayout";
const Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const ProductsManagement = lazy(() => import("../pages/admin/ProductManagement"));
const CategoriesManagement = lazy(() => import("../pages/admin/CategoriesManagement"));
const AttributesManagement = lazy(() => import("../pages/admin/AttributesManagement"));
const OrdersManagement = lazy(() => import("../pages/admin/OrdersManagement"));
const UsersManagement = lazy(() => import("../pages/admin/UsersManagement"));
const PromotionsManagement = lazy(() => import("../pages/admin/PromotionsManagement"));
const CouponsManagement = lazy(() => import("../pages/admin/CouponsManagement"));
const Statistics = lazy(() => import("../pages/admin/Statistics"));
const ProductDetailManagement = lazy(() => import("../pages/admin/ProductDetailManagement"));
const BrandsManagement = lazy(() => import("../pages/admin/BrandsManagement"));
const BannersManagement = lazy(() => import("../pages/admin/BannersManagement"));
const BlogManagement = lazy(() => import("../pages/admin/BlogManagement"));
const ChatManagement = lazy(() => import("../pages/admin/ChatManagement"));
const InventoryManagement = lazy(() => import("../pages/admin/InventoryManagement"));
const UserActivityManagement = lazy(() => import("../pages/admin/UserActivityManagement"));
const RolesManagement = lazy(() => import("../pages/admin/RolesManagement"));
const PermissionsManagement = lazy(() => import("../pages/admin/PermissionsManagement"));
const FlashSaleManagement = lazy(() => import("../pages/admin/FlashSaleManagement"));
const TransactionsManagement = lazy(() => import("../pages/admin/TransactionsManagement"));

import ProtectedRoute from "../routes/ProtectedRoute";
import AdminRoute from "../routes/AdminRoute";
const Blog = lazy(() => import("../pages/Blog"));
const BlogDetail = lazy(() => import("../pages/BlogDetail"));
const Contact = lazy(() => import("../pages/Contact"));
const FAQ = lazy(() => import("../pages/FAQ"));
const About = lazy(() => import("../pages/About"));

const AnimatedRoutes = () => {
  const location = useLocation();
  const lastLocationStr = useRef(location.pathname);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (lastLocationStr.current !== location.pathname) {
      const timeSpent = Date.now() - startTime.current;
      logActivity('TIME_ON_PAGE', { path: lastLocationStr.current, durationMs: timeSpent });

      lastLocationStr.current = location.pathname;
      startTime.current = Date.now();
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleUnload = () => {
      const timeSpent = Date.now() - startTime.current;
      logActivity('TIME_ON_PAGE', { path: lastLocationStr.current, durationMs: timeSpent, event: 'unload' });
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mb-4" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải trang...</p>
      </div>
    }>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* User Layout Wrapper */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/flash-sale" element={<ProtectedRoute><FlashSalePage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/payment-result" element={<ProtectedRoute><PaymentResult /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/category/:slug" element={<ProtectedRoute><Category /></ProtectedRoute>} />
          <Route path="/brands" element={<BrandsPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/voucher-wallet" element={<ProtectedRoute><VoucherWallet /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notification /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
        </Route>

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
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="product-detail" element={<ProductDetailManagement />} />
            <Route path="blogs" element={<BlogManagement />} />
            <Route path="chat" element={<ChatManagement />} />
            <Route path="user-activities" element={<UserActivityManagement />} />
            <Route path="roles" element={<RolesManagement />} />
            <Route path="permissions" element={<PermissionsManagement />} />
            <Route path="flash-sales" element={<FlashSaleManagement />} />
            <Route path="transactions" element={<TransactionsManagement />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AnimatedRoutes;
