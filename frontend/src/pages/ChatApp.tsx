import React from 'react';
import { Box, Grid } from '@mui/material';
import { useParams } from 'react-router-dom';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

const ChatApp: React.FC = () => {
  const { id } = useParams();
  const channelId = id || 'public';

  return (
    <Box sx={{ height: 'calc(100vh - 64px)' }}>
      <Grid container sx={{ height: '100%' }}>
        <Grid item xs={3} sx={{ borderRight: 1, borderColor: 'divider' }}>
          <ChatList />
        </Grid>
        <Grid item xs={9}>
          <ChatWindow channelId={channelId} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatApp;