import React from 'react';
import { List, ListItem, ListItemButton, ListItemAvatar, Avatar, ListItemText, Typography, Box } from '@mui/material';
import { ChatListProps } from '../types';

const ChatList: React.FC<ChatListProps> = () => {
  return (
    <Box>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">聊天</Typography>
      </Box>
      <List>
        <ListItemButton>
          <ListItemAvatar>
            <Avatar>公共</Avatar>
          </ListItemAvatar>
          <ListItemText 
            primary="公共频道"
            secondary="欢迎加入讨论"
          />
        </ListItemButton>
      </List>
    </Box>
  );
};

export default ChatList;