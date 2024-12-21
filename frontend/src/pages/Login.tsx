import React, { useState } from 'react';
import { Box, Card, TextField, Button, Typography, Stack, Divider, Alert } from '@mui/material';

interface LoginProps {
  onLogin: (isGuest?: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGuestLogin = () => {
    if (username) {
      localStorage.setItem('guestName', username);
      onLogin(true);
    }
  };

  const handleRegister = async () => {
    setError(null);

    if (!username || !password || !confirmPassword || !email) {
      setError('所有字段均为必填项');
      return;
    }

    if (password !== confirmPassword) {
      setError('密码和确认密码不一致');
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('邮箱格式不正确');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('注册成功，请登录');
        setEmail('');
        setUsername('');
        setPassword('');
        setError(null);
        setIsRegistering(false)
      } else {
        setError(data.message || '注册失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    }

    console.log('注册信息:', { username, password, email });
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" mb={3}>{isRegistering ? '注册' : '登录'}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} {/* 显示错误信息 */}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>} {/* 显示成功信息 */}
        <Stack spacing={2}>
          {!isGuest ? (
            !isRegistering ? (
              <>
                <TextField label="用户名" fullWidth onChange={(e) => setUsername(e.target.value)} />
                <TextField label="密码" type="password" fullWidth onChange={(e) => setPassword(e.target.value)} />
                <Button variant="contained" fullWidth onClick={() => onLogin(false)}>
                  登录
                </Button>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Button variant="outlined" fullWidth onClick={() => setIsRegistering(true)}>
                    注册
                  </Button>
                  <Divider style={{ margin: "0 10px" }}>或</Divider>
                  <Button variant="outlined" fullWidth onClick={() => setIsGuest(true)}>
                    访客模式
                  </Button>
                </div>
              </>
            ) : (
              <>
                <TextField label="用户名" fullWidth onChange={(e) => setUsername(e.target.value)} />
                <TextField label="密码" type="password" fullWidth onChange={(e) => setPassword(e.target.value)} />
                <TextField label="确认密码" type="password" fullWidth onChange={(e) => setConfirmPassword(e.target.value)} />
                <TextField label="邮箱" type="email" fullWidth onChange={(e) => setEmail(e.target.value)} />
                <Button variant="contained" fullWidth onClick={handleRegister}>
                  注册
                </Button>
                <Button variant="text" onClick={() => setIsRegistering(false)}>
                  返回登录
                </Button>
              </>
            )
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