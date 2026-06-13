import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    stompClient: Client | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);
const defaultSocketContext: SocketContextType = {
    stompClient: null,
    isConnected: false,
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const stompClient = useMemo(() => {
        if (!user) return null;

            const socketUrl = import.meta.env.VITE_WS_BASE_URL || "http://localhost:8080/websocket";
            const token = localStorage.getItem("access_token");

            return new Client({
                webSocketFactory: () => new SockJS(socketUrl),
                connectHeaders: {
                    Authorization: `Bearer ${token}`
                },
                onConnect: () => {
                    setIsConnected(true);
                },
                onDisconnect: () => {
                    setIsConnected(false);
                },
                onStompError: (frame) => {
                    console.error("STOMP error in SocketContext", frame);
                    setIsConnected(false);
                },
                onWebSocketClose: () => {
                    setIsConnected(false);
                },
                onWebSocketError: (error) => {
                    console.error("WebSocket error in SocketContext", error);
                    setIsConnected(false);
                },
            });
    }, [user]);

    useEffect(() => {
        if (!stompClient) {
            return;
        }

        stompClient.activate();
        return () => {
            stompClient.deactivate();
        };
    }, [stompClient]);

    const value = useMemo(() => ({
        stompClient,
        isConnected
    }), [stompClient, isConnected]);

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
    const context = useContext(SocketContext);
    return context ?? defaultSocketContext;
};
