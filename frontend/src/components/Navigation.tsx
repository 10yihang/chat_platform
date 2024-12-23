import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Button, Stack, Badge, IconButton, Drawer, Box, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FriendRequestNotification from './notifications/FriendRequestNotification';
import { NavigationProps, FriendRequestData } from '../types';

const Navigation: React.FC<NavigationProps> = ({ onLogout, socket }) => {
  const navigate = useNavigate();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const hasUnread = notifications.some(n => !n.read);

  useEffect(() => {
    console.log('Navigation socket:', socket);
    interface Notification {
      type: 'friend_request';
      data: FriendRequestData;
      read: boolean;
    }

    if (socket) {
      console.log('Socket:', socket);
      console.log('Socket connected status:', socket.connected);
      console.log('Socket connected, listening for friend requests');
      
      socket.on('connect', () => {
        console.log('Socket connected');
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('friend_request_received', (data: FriendRequestData) => {
        console.log('收到好友请求:', data);
        setNotifications(prev => [...prev, {
          type: 'friend_request',
          data,
          read: false
        } as Notification]);
      });
    }

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('friend_request_received');
      }
    };
  }, [socket]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  };

  return (
    <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
      <IconButton 
        color="inherit" 
        onClick={() => setNotificationOpen(true)}
      >
        <Badge color="error" variant="dot" invisible={!hasUnread}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Button color="inherit" component={RouterLink} to="/">
        主页
      </Button>
      <Button color="inherit" component={RouterLink} to="/room">
        聊天室
      </Button>
      <Button color="inherit" component={RouterLink} to="/profile">
        个人资料
      </Button>
      <Button
        color="inherit"
        onClick={handleLogout}
        startIcon={<LogoutIcon />}
      >
        退出
      </Button>
      <Drawer
        anchor="right"
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      >
        <Box sx={{ width: 350, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>通知</Typography>
          {notifications.map((notification, index) => {
            if (notification.type === 'friend_request') {
              return (
                <FriendRequestNotification
                  key={index}
                  sender={notification.data.sender}
                  onAccept={() => {
                    socket?.emit('friend_request_response', {
                      request_id: notification.data.request_id,
                      response: 'accepted'
                    });
                    setNotifications(prev => 
                      prev.filter(n => n.data.request_id !== notification.data.request_id)
                    );
                  }}
                  onReject={() => {
                    socket?.emit('friend_request_response', {
                      request_id: notification.data.request_id,
                      response: 'rejected'
                    });
                    setNotifications(prev => 
                      prev.filter(n => n.data.request_id !== notification.data.request_id)
                    );
                  }}
                />
              );
            }
            return null;
          })}
        </Box>
      </Drawer>
    </Stack>
  );
};

export default Navigation;