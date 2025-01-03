import React, { useState, useEffect } from 'react';
import { Box, Paper, InputBase, IconButton, Stack } from '@mui/material';
import Chat from './Chat';
import { ChatWindowProps } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

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
      height: '100%',         // 改为100vh
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: '#fff',
        zIndex: 1000,
        flexShrink: 0         // 添加这行
      }}>
        {title || '加载中...'}
      </Box>
      <Box sx={{ 
        flex: 1, 
        overflow: 'hidden',
        display: 'flex',      // 添加这行
        flexDirection: 'column' // 添加这行
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${channelId || ''}-${groupId || ''}-${friendId || ''}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{ height: '100%' }}
          >
            <Chat 
              channelId={channelId} 
              groupId={groupId} 
              friendId={friendId} 
              userName={userName} 
              avatar={avatar}
            />
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default ChatWindow;