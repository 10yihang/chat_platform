import React from 'react';
import { Box, Paper, InputBase, IconButton, Stack } from '@mui/material';
import { Send, AttachFile, Mic, Videocam } from '@mui/icons-material';

interface ChatWindowProps {
  channelId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ channelId }) => {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        {channelId === 'public' ? '公共频道' : '私人聊天'}
      </Box>
      <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
        {/* 消息列表 */}
      </Box>
      <Paper sx={{ p: 2, m: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton>
            <AttachFile />
          </IconButton>
          <InputBase
            fullWidth
            placeholder="输入消息..."
            sx={{ ml: 1 }}
          />
          <IconButton>
            <Mic />
          </IconButton>
          <IconButton>
            <Videocam />
          </IconButton>
          <IconButton color="primary">
            <Send />
          </IconButton>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ChatWindow;