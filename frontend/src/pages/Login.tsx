import React, { useState } from 'react';
import { Box, Card, TextField, Button, Typography, Stack, Divider } from '@mui/material';

interface LoginProps {
  onLogin: (isGuest?: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [isGuest, setIsGuest] = useState(false);

  const handleGuestLogin = () => {
    if (username) {
      localStorage.setItem('guestName', username);
      onLogin(true);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" mb={3}>登录</Typography>
        <Stack spacing={2}>
          {!isGuest ? (
            <>
              <TextField label="用户名" fullWidth />
              <TextField label="密码" type="password" fullWidth />
              <Button variant="contained" fullWidth onClick={() => onLogin(false)}>
                登录
              </Button>
              <Divider>或</Divider>
              <Button variant="outlined" fullWidth onClick={() => setIsGuest(true)}>
                访客模式
              </Button>
            </>
          ) : (
            <>
              <TextField 
                label="访客用户名" 
                fullWidth 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleGuestLogin}
                disabled={!username}
              >
                进入公共频道
              </Button>
              <Button variant="text" onClick={() => setIsGuest(false)}>
                返回登录
              </Button>
            </>
          )}
        </Stack>
      </Card>
    </Box>
  );
};

export default Login;