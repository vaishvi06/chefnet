import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../utils/tokenStorage';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    const token = getAccessToken();

    if (!isAuthenticated || !token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    // Handle incoming personal notifications
    socket.on('notification', (notification) => {
      // Toast notification with custom styling
      toast((t) => (
        <div className="flex items-start gap-2.5">
          <span className="text-xl">🔔</span>
          <div className="text-sm">
            <p className="font-semibold text-neutral-900">ChiefNet Notification</p>
            <p className="text-neutral-600 mt-0.5">{notification.message}</p>
          </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-right'
      });
    });

    socket.on('joined_room', ({ room }) => {
      setActiveRoom(room);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  const joinSubscription = useCallback((subscriptionId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_subscription', { subscriptionId });
    }
  }, [isConnected]);

  const sendMessage = useCallback((subscriptionId, text) => {
    if (socketRef.current && isConnected && text?.trim()) {
      socketRef.current.emit('send_message', { subscriptionId, text: text.trim() });
    }
  }, [isConnected]);

  const markRead = useCallback((messageId) => {
    if (socketRef.current && isConnected && messageId) {
      socketRef.current.emit('mark_read', { messageId });
    }
  }, [isConnected]);

  const value = {
    socket: socketRef.current,
    isConnected,
    activeRoom,
    joinSubscription,
    sendMessage,
    markRead
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

