import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Avatar, Typography, Button, Box } from '@mui/material';
import { UserProfileDialogProps } from '../types';


const UserProfileDialog: React.FC<UserProfileDialogProps> = ({ open, onClose, userId, socket }) => {
  const [profile, setProfile] = useState<any>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');
  

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      checkFriendship();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
    const response = await fetch(`${global.preUrl}/api/profile/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('获取用户资料失败:', error);
    }
  };

  const checkFriendship = async () => {
    try {
      const response = await fetch(`${global.preUrl}/api/friend/check/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setIsFriend(data.is_friend);
    } catch (error) {
      console.error('检查好友关系失败:', error);
    }
  };

  if(!socket) return null;

  const handleAddFriend = () => {
    socket.emit('friend_request', {
      sender_id: currentUserId,
      receiver_id: userId
    });
    setRequestSent(true);
  };

  if (!profile) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>用户资料</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, gap: 2 }}>
          <Avatar src={profile.avatar} sx={{ width: 100, height: 100 }} />
          <Typography variant="h6">{profile.username}</Typography>
          <Typography variant="body1">{profile.bio || '这个人很懒，什么都没写~'}</Typography>
          
          {userId !== currentUserId && !isFriend && !requestSent && (
            <Button variant="contained" onClick={handleAddFriend}>
              添加好友
            </Button>
          )}
          {requestSent && (
            <Typography color="primary">已发送好友请求</Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;