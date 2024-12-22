import React, { useState, useEffect } from 'react';
import { Box, Paper, InputBase, IconButton, Stack } from '@mui/material';
import Chat from './Chat';

interface ChatWindowProps {
  channelId: string;
  chatName?: string;
  groupId?: string;
  friendId?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ channelId, groupId, friendId }) => {
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        {title || '加载中...'}
      </Box>
      <Chat channelId={channelId} groupId={groupId} friendId={friendId} />
    </Box>
  );
};

export default ChatWindow;