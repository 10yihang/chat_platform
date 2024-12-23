import React from 'react';
import { Box } from '@mui/material';
import { useParams, useLocation } from 'react-router-dom';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

const ChatApp: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  
  // 根据路径确定聊天类型
  const isFriendChat = location.pathname.includes('/friend/');
  const isGroupChat = location.pathname.includes('/group/');
  
  // 设置相应的属性
  const chatProps = {
    channelId: !id ? 'public' : undefined,
    friendId: isFriendChat ? id : undefined,
    groupId: isGroupChat ? id : undefined
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)',
      display: 'flex',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        width: '320px',
        borderRight: 1,
        borderColor: 'divider',
        overflow: 'auto'
      }}>
        <ChatList />
      </Box>
      <Box sx={{ 
        flex: 1,
        overflow: 'hidden'
      }}>
        <ChatWindow {...chatProps} />
      </Box>
    </Box>
  );
};

export default ChatApp;