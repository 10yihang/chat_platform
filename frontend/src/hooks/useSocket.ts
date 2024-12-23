import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { message } from 'antd';

export const useSocket = (url: string): Socket | undefined => {
  const socket = useRef<Socket>();
  const [error, setError] = useState<boolean>(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!socket.current && !error) {
      try {
        socket.current = io(url, {
          transports: ['websocket'],
          upgrade: false,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          auth: { token },
          rememberUpgrade: true,
          transportOptions: {
            polling: {
              enabled: false
            }
          }
        });

        socket.current.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          message.error('网络连接失败，部分功能可能无法使用');
          setError(true);
        });

      } catch (err) {
        console.error('Socket initialization failed:', err);
        message.error('网络连接失败，部分功能可能无法使用');
        setError(true);
      }
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = undefined;
      }
    };
  }, [url, error]);

  return socket.current || undefined;
};