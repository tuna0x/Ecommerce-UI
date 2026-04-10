import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    stompClient: Client | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const stompClientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (user) {
            const socketUrl = import.meta.env.VITE_WS_BASE_URL || "http://localhost:8080/websocket";
            const token = localStorage.getItem("access_token");
            console.log(">>> SocketProvider: Initializing STOMP client for user:", user?.email);

            const client = new Client({
                webSocketFactory: () => new SockJS(socketUrl),
                connectHeaders: {
                    Authorization: `Bearer ${token}`
                },
                onConnect: () => {
                    console.log('>>> Connected to STOMP for:', user?.email);
                    setIsConnected(true);
                },
                onDisconnect: () => {
                    console.log('>>> Disconnected from STOMP');
                    setIsConnected(false);
                },
                onStompError: (frame) => {
                    console.error('>>> STOMP error: ' + frame.headers['message']);
                },
            });

            client.activate();
            stompClientRef.current = client;

            return () => {
                if (stompClientRef.current) {
                    stompClientRef.current.deactivate();
                }
            };
        } else {
            setIsConnected(false);
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ stompClient: stompClientRef.current, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocket must be used within SocketProvider');
    return context;
};
