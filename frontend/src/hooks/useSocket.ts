import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (url: string) => {
  const socket = useRef<Socket>();

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('token:', token);
    
    socket.current = io(url, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
      withCredentials: true
    });

    socket.current.on('connect', () => {
      console.log('WebSocket连接成功!');
    });

    socket.current.on('error', (error: any) => {
      console.error('Socket错误:', error);
    });

    socket.current.on('connect_error', (error: any) => {
      console.error('连接错误:', error);
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [url]);

  return socket.current;
};