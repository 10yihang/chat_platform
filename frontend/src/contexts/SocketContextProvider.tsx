import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useSocket } from '../hooks/useSocket';
import { message } from 'antd';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ 
  socket: null, 
  isConnected: false 
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket, isConnected: socketConnected } = useSocket(global.socketUrl);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
        message.info('网络连接已断开，正在重新连接...');
      });

      socket.on('connect_error', (error) => {
        console.error('连接错误:', error);
        setIsConnected(false);
        message.error('网络连接失败，请检查网络设置');
      });
    }

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export default SocketProvider;