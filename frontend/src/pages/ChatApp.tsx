import React from 'react';
import { Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

const ChatApp: React.FC = () => {
  const { id } = useParams();
  const channelId = id || 'public';

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
        <ChatWindow channelId={channelId} />
      </Box>
    </Box>
  );
};

export default ChatApp;