import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Button, Stack, Badge, IconButton, Drawer, Box, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FriendRequestNotification from './notifications/FriendRequestNotification';
import { NavigationProps, FriendRequestData } from '../types';
import SocketProvider, { useSocketContext } from '../contexts/SocketContextProvider';

const Navigation: React.FC<NavigationProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const hasUnread = notifications.some(n => !n.read);
  const {socket, isConnected} = useSocketContext();

  useEffect(() => {
    interface Notification {
      type: 'friend_request';
      data: FriendRequestData;
      read: boolean;
    }

    if (socket) {

      socket?.on('friend_request_received', (data: FriendRequestData) => {
        console.log('收到好友请求:', data);
        setNotifications(prev => [...prev, {
          type: 'friend_request',
          data,
          read: false
        } as Notification]);
      });

      socket.on('friend_request_response', (data) => {
        // 移除相关的好友请求通知
        setNotifications(prev => 
          prev.filter(n => 
            !(n.type === 'friend_request' && n.data.request_id === data.request_id)
          )
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('friend_request_received');
        socket.off('friend_request_accepted');
        socket.off('friend_request_rejected');
      }
    };
  }, [socket, isConnected]);

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
                  key={notification.data.request_id}
                  {...notification.data}
                  onClose={() => {
                    setNotifications(prev => 
                      prev.filter((_, i) => i !== index)
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