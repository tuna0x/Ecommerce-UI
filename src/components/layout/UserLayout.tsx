import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from '../TopBar';
import Header from '../Header';
import CartSidebar from '../CartSidebar';
import Footer from '../Footer';
import MobileNavBar from '../MobileNavBar';
import ChatBot from '../ChatBot';

const UserLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopBar />
        <Header />
      </div>
      <main className="pt-[116px] md:pt-[164px]">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent opacity-50 mb-4"></div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải trang...</p>
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
      <CartSidebar />
      <Footer />
      <MobileNavBar />
      <ChatBot />
    </div>
  );
};

export default UserLayout;
