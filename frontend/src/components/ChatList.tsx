import React, { useState, useEffect } from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemAvatar, 
  Avatar, 
  ListItemText, 
  Typography, 
  Box,
  Badge 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useSocketContext } from '../contexts/SocketContextProvider';
import {ChatItem, FriendRequestAcceptedData} from '../types';
import {OnlineBadge} from '../styles';
import { motion } from 'framer-motion';

const ListItemMotion = motion(ListItemButton);

const ChatList: React.FC = () => {
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const navigate = useNavigate();
  const { socket } = useSocketContext();

  useEffect(() => {
    const fetchChatList = async () => {
      try {
        const [groupsRes, friendsRes] = await Promise.all([
          fetch(`${global.preUrl}/api/user/groups`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          fetch(`${global.preUrl}/api/user/friends`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);

        const groups = await groupsRes.json();
        const friends = await friendsRes.json();
        setChatItems([...groups, ...friends]);

        if (socket) {
          socket.emit('get_online_status', {
            user_ids: friends.map((f: ChatItem) => f.id)
          });
        }
      } catch (error) {
        console.error('获取聊天列表失败:', error);
      }
    };

    fetchChatList();
  }, [socket]);

  useEffect(() => {
    if (socket) {
      // 刷新页面时立即请求在线状态
      const requestOnlineStatus = () => {
        const friendIds = chatItems
          .filter(item => item.type === 'friend')
          .map(item => item.id);
          
        if (friendIds.length > 0) {
          socket.emit('get_online_status', {
            user_ids: friendIds
          });
        }
      };

      // 监听连接成功事件
      socket.on('connect', () => {
        requestOnlineStatus();
      });

      // 监听在线用户列表更新
      socket.on('online_users', (data: { users: number[] }) => {
        setOnlineUsers(data.users);
        // 重新请求在线状态以确保数据准确性
        requestOnlineStatus();
      });

      // 监听在线状态更新
      socket.on('online_status_update', (statusMap: {[key: number]: boolean}) => {
        setOnlineUsers(prev => {
          const newOnlineUsers = Object.entries(statusMap)
            .filter(([_, isOnline]) => isOnline)
            .map(([userId]) => parseInt(userId));
          return Array.from(new Set([...prev, ...newOnlineUsers]));
        });
      });

      // 监听单个用户上线
      socket.on('user_online', (data: { user_id: number }) => {
        setOnlineUsers(prev => {
          if (!prev.includes(data.user_id)) {
            return [...prev, data.user_id];
          }
          return prev;
        });
      });

      // 监听单个用户离线
      socket.on('user_offline', (data: { user_id: number }) => {
        setOnlineUsers(prev => prev.filter(id => id !== data.user_id));
      });

      // 初始化时请求一次在线状态
      if (chatItems.length > 0) {
        requestOnlineStatus();
      }

      return () => {
        if (socket) {
          socket.off('connect');
          socket.off('online_users');
          socket.off('online_status_update');
          socket.off('user_online');
          socket.off('user_offline');
        }
      };
    }
  }, [socket, chatItems]);

  useEffect(() => {
    if (socket) {
      // 监听在线用户列表更新
      socket.on('online_users', (data: { users: number[] }) => {
        setOnlineUsers(data.users);
      });

      // 监听单个用户上线
      socket.on('user_online', (data: { user_id: number }) => {
        setOnlineUsers(prev => {
          if (!prev.includes(data.user_id)) {
            return [...prev, data.user_id];
          }
          return prev;
        });
      });

      // 监听单个用户离线
      socket.on('user_offline', (data: { user_id: number }) => {
        setOnlineUsers(prev => prev.filter(id => id !== data.user_id));
      });

      socket.on('friend_request_accepted', (data: FriendRequestAcceptedData) => {
        const currentUserId = parseInt(localStorage.getItem('userId') || '0');
        const newFriend = data.sender.id === currentUserId ? data.receiver : data.sender;
        
        setChatItems(prev => {
          const exists = prev.some(item => 
            item.type === 'friend' && item.id === newFriend.id
          );
          if (exists) return prev;
          
          return [...prev, {
            id: newFriend.id,
            name: newFriend.username,
            avatar: newFriend.avatar,
            type: 'friend'
          }];
        });
      
        // 只在用户确实在线时添加到在线列表
        if (newFriend.status === 'online') {
          setOnlineUsers(prev => {
            if (!prev.includes(newFriend.id)) {
              return [...prev, newFriend.id];
            }
            return prev;
          });
        }
      });

      // 组件加载时请求在线状态
      socket.emit('get_online_status', {
        user_ids: chatItems
          .filter(item => item.type === 'friend')
          .map(item => item.id)
      });
    }

    return () => {
      if (socket) {
        socket.off('online_users');
        socket.off('user_online');
        socket.off('user_offline');
        socket.off('friend_request_accepted');
      }
    };
  }, [socket, chatItems]);

  const handleChatItemClick = (item: ChatItem) => {
    if (item.type === 'group') {
      navigate(`/chat/group/${item.id}`, { replace: true });
    } else {
      navigate(`/chat/friend/${item.id}`, { replace: true });
    }
  };

  const renderAvatar = (item: ChatItem) => {
    const avatar = (
      <Avatar src={item.avatar}>
        {item.name.charAt(0)}
      </Avatar>
    );

    if (item.type === 'friend' && onlineUsers.includes(item.id)) {
      return (
        <OnlineBadge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
        >
          {avatar}
        </OnlineBadge>
      );
    }

    return avatar;
  };

  return (
    <Box>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">聊天</Typography>
      </Box>
      <List>
        {chatItems.map((item, index) => (
          <ListItemMotion
            key={`${item.type}-${item.id}`}
            onClick={() => handleChatItemClick(item)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <ListItemAvatar>
              {renderAvatar(item)}
            </ListItemAvatar>
            <ListItemText 
              primary={item.name}
              secondary={item.type === 'group' ? '群聊' : 
                onlineUsers.includes(item.id) ? '在线' : '离线'}
            />
          </ListItemMotion>        ))}
      </List>
    </Box>
  );
};

export default ChatList;