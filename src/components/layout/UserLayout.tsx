import React from 'react';
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
      <TopBar />
      <Header />
      <main>
        <Outlet />
      </main>
      <CartSidebar />
      <Footer />
      <MobileNavBar />
      <ChatBot />
    </div>
  );
};

export default UserLayout;
