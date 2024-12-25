import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  Avatar, 
  Typography, 
  TextField, 
  Button, 
  Stack 
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface ProfileData {
  username: string;
  email: string;
  avatar: string;
  bio: string;
  location: string;
  phone: string;
}

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  marginBottom: theme.spacing(2)
}));

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    phone: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${global.preUrl}/api/profile/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      console.log('data:', data);
      setProfile(data);
      setFormData({
        bio: data.bio || '',
        location: data.location || '',
        phone: data.phone || ''
      });
    } catch (error) {
      console.error('获取个人资料失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${global.preUrl}/api/profile/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setEditing(false);
        fetchProfile();
      }
    } catch (error) {
      console.error('更新个人资料失败:', error);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        return alert('文件大小不能超过 1MB');
      }
      const formData = new FormData();
      formData.append('avatar', file);
      // console.log('formData:', formData);
      
      try {
        const response = await fetch(`${global.preUrl}/api/profile/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        if (response.ok) {
          // console.log('response:', response);
          fetchProfile();
        }
      } catch (error) {
        console.error('上传头像失败:', error);
      }
    }
  };

  if (loading) {
    return <Box>加载中...</Box>;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Card sx={{ p: 4 }}>
        <Stack spacing={3} alignItems="center">
          <input
            type="file"
            id="avatar-input"
            hidden
            accept="image/*"
            onChange={handleAvatarChange}
          />
          <label htmlFor="avatar-input">
            <ProfileAvatar
              src={profile?.avatar}
              sx={{ cursor: 'pointer' }}
            />
          </label>
          
          <Typography variant="h5">{profile?.username}</Typography>
          <Typography color="textSecondary">{profile?.email}</Typography>

          {editing ? (
            <Stack spacing={2} sx={{ width: '100%' }}>
              <TextField
                label="个人简介"
                multiline
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
              <TextField
                label="所在地"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <TextField
                label="电话"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={() => setEditing(false)}>取消</Button>
                <Button variant="contained" onClick={handleSubmit}>保存</Button>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ width: '100%' }}>
              <Typography variant="body1">
                <strong>个人简介：</strong> {profile?.bio || '未设置'}
              </Typography>
              <Typography variant="body1">
                <strong>所在地：</strong> {profile?.location || '未设置'}
              </Typography>
              <Typography variant="body1">
                <strong>电话：</strong> {profile?.phone || '未设置'}
              </Typography>
              <Button variant="outlined" onClick={() => setEditing(true)}>
                编辑资料
              </Button>
            </Stack>
          )}
        </Stack>
      </Card>
    </Box>
  );
};

export default Profile;