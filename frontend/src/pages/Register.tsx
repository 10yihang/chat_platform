import React, { useState } from 'react';
import { Box, Card, TextField, Button, Typography, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" mb={3}>注册</Typography>
        <Stack spacing={2}>
          <TextField label="用户名" fullWidth />
          <TextField label="密码" type="password" fullWidth />
          <TextField label="确认密码" type="password" fullWidth />
          <Button variant="contained" fullWidth>注册</Button>
          <Button variant="text" onClick={() => navigate('/login')}>
            已有账号？登录
          </Button>
        </Stack>
      </Card>
    </Box>
  );
};

export default Register;