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
import {ChatItem} from '../types';
import {OnlineBadge} from '../styles';

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
      socket.on('online_status_update', (statusMap: {[key: number]: boolean}) => {
        setOnlineUsers(Object.entries(statusMap)
          .filter(([_, isOnline]) => isOnline)
          .map(([userId]) => parseInt(userId)));
      });

      socket.on('user_online', (userId: number) => {
        setOnlineUsers(prev => [...prev, userId]);
      });

      socket.on('user_offline', (userId: number) => {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });
    }

    return () => {
      if (socket) {
        socket.off('online_status_update');
        socket.off('user_online');
        socket.off('user_offline');
      }
    };
  }, [socket]);

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
        {chatItems.map((item) => (
          <ListItemButton 
            key={`${item.type}-${item.id}`}
            onClick={() => handleChatItemClick(item)}
          >
            <ListItemAvatar>
              {renderAvatar(item)}
            </ListItemAvatar>
            <ListItemText 
              primary={item.name}
              secondary={item.type === 'group' ? '群聊' : 
                onlineUsers.includes(item.id) ? '在线' : '离线'}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default ChatList;