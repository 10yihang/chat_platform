import React from 'react';
import { Box, Typography, Button, Avatar } from '@mui/material';
import { useSocketContext } from '../../contexts/SocketContextProvider';
import {FriendRequestData} from '../../types';


const FriendRequestNotification: React.FC<FriendRequestData> = ({
  request_id, sender, onClose
}) => {
  const {socket, isConnected} = useSocketContext();

  const friend_request_response = async (status: string) => {
    try{
      if (socket) {
        socket?.emit('friend_request_response', {
          request_id: request_id,
          status: status
        });
        
        onClose();
      }
    } catch (error) {
      console.error('处理好友请求失败:', error);
    }
  };
  
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
          onClick={() => friend_request_response('accepted')}
          color="primary"
        >
          接受
        </Button>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => friend_request_response('rejected')}
          color="error"
        >
          拒绝
        </Button>
      </Box>
    </Box>
  );
};

export default FriendRequestNotification;