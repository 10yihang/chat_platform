import React from 'react';
import { Box, Typography, Button, Avatar } from '@mui/material';

interface FriendRequestNotificationProps {
  sender: {
    id: number;
    username: string;
    avatar?: string;
  };
  onAccept: () => void;
  onReject: () => void;
}

const FriendRequestNotification: React.FC<FriendRequestNotificationProps> = ({
  sender,
  onAccept,
  onReject
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      p: 2, 
      borderBottom: '1px solid #eee'
    }}>
      <Avatar src={sender.avatar} sx={{ mr: 2 }} />
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1">
          {sender.username} 请求添加您为好友
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button 
          variant="contained" 
          size="small" 
          onClick={onAccept}
          color="primary"
        >
          接受
        </Button>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={onReject}
          color="error"
        >
          拒绝
        </Button>
      </Box>
    </Box>
  );
};

export default FriendRequestNotification;