import React, { useState, useEffect } from 'react';
import { Box, Paper, InputBase, IconButton, Stack } from '@mui/material';
import Chat from './Chat';
import { ChatWindowProps } from '../types';

const ChatWindow: React.FC<ChatWindowProps> = ({ channelId, groupId, friendId, userName, avatar }) => {
  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    
    const fetchChatInfo = async () => {
      try {
        if (groupId) {
          const response = await fetch(`${global.preUrl}/api/group/${groupId}`);
          const data = await response.json();
          setTitle(data.name);
        } else if (friendId) {
          const response = await fetch(`${global.preUrl}/api/user/${friendId}`);
          const data = await response.json();
          setTitle(data.username);
        } else if (channelId === 'public') {
          const response = await fetch(`${global.preUrl}/api/group/1`);
          const data = await response.json();
          setTitle(data.name);
        }
      } catch (error) {
        console.error('获取聊天信息失败:', error);
      }
    };

    fetchChatInfo();
  }, [channelId, groupId, friendId]);

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: '#fff',
        zIndex: 1000
      }}>
        {title || '加载中...'}
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Chat 
          channelId={channelId} 
          groupId={groupId} 
          friendId={friendId} 
          userName={userName} 
          avatar={avatar}
        />
      </Box>
    </Box>
  );
};

export default ChatWindow;