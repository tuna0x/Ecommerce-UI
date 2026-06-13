import React from "react";
import { SocketProvider } from "./SocketContext";
import { NotificationProvider } from "./NotificationContext";
import { ChatProvider } from "./ChatContext";

const RealtimeProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SocketProvider>
      <NotificationProvider>
        <ChatProvider>{children}</ChatProvider>
      </NotificationProvider>
    </SocketProvider>
  );
};

export default RealtimeProviders;
