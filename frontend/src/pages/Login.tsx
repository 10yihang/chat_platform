import React, { useState, useEffect } from 'react';
import { Box, Card, TextField, Button, Typography, Stack, Divider, Alert, CircularProgress } from '@mui/material';

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
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [captchaUrl, setCaptchaUrl] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  //获取图形验证码
  const refreshCaptcha = async () => {
    try {
      const response = await fetch(preUrl + '/api/auth/captcha', {
        credentials: 'include'  
      });
      const data = await response.json();
      
      if (response.ok) {
        setCaptchaUrl(data.captcha);
      } else {
        // 处理 429 状态码
        if (response.status === 429) {
          setError(data.message);  // 显示需要等待的时间
        } else {
          setError('获取验证码失败');
        }
      }
    } catch (err) {
      setError('获取验证码失败');
    }
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  // 检查邮箱验证码发送状态
  const checkEmailCodeStatus = async () => {
    if (!email) return;
    
    try {
      const response = await fetch(`${preUrl}/api/auth/email-code-status?email=${email}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.remaining > 0) {
        setCountdown(data.remaining);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error('检查验证码状态失败:', err);
    }
  };

  useEffect(() => {
    if (email) {
      checkEmailCodeStatus();
    }
  }, [email]);

  //获取邮箱验证码
  const sendEmailCode = async () => {
    if (!email) {
      setError('请输入邮箱');
      return;
    }

    try {
      const response = await fetch(preUrl + '/api/auth/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCountdown(data.remaining || 60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        if (response.status === 429) {
          setCountdown(data.remaining);
        }
        setError(data.message);
      }
    } catch (err) {
      setError('发送验证码失败');
    }
  };

  const handleLogin = async (isGuest?: boolean) => {
    console.log(preUrl);
    setError(null);

    if (!email || !password) {
      console.log(email, password);
      setError('邮箱和密码均为必填项');
      return;
    }
    if (!captchaInput) {
      setError('请输入验证码');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch(preUrl + '/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          captcha: captchaInput
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.username);
        localStorage.setItem('email', data.email);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('IsGuest', 'false');
        onLogin(isGuest);
      } else {
        setError(data.message || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoginLoading(false);
    }

    console.log('登录信息:', { email, password, captchaInput });
  };

  const handleGuestLogin = async () => {
    if (username) {
      if (!captchaInput) {
        setError('请输入验证码');
        return;
      };
      localStorage.setItem('IsGuest', 'true');
      localStorage.setItem('guestName', username);
      setLoginLoading(true);
      try {
        const response = await fetch(preUrl + '/api/auth/login', {
          method: 'POST',
          credentials: 'include',  // 添加这一行
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: '',
            password: '',
            captcha: captchaInput
          }),
        });

        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('userName', username);
          // localStorage.setItem('email', data.email);
          localStorage.setItem('userId', '0');
          localStorage.setItem('IsGuest', 'true');
          onLogin(isGuest);
        } else {
          setError(data.message || '登录失败');
        }
      } catch (err) {
        setError('网络错误，请稍后重试');
      } finally {
        setLoginLoading(false);
      }
    }
  };

  const handleRegister = async () => {
    setError(null);

    if (!username || !password || !confirmPassword || !email) {
      setError('所有字段均为必填项');
      return;
    }

    if (!emailCode) {
      setError('请输入邮箱验证码');
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

    setRegisterLoading(true);
    try {
      const response = await fetch(preUrl + '/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email,
          code: emailCode
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
    } finally {
      setRegisterLoading(false);
    }

    console.log('注册信息:', { username, password, email, emailCode });
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
                <TextField label="邮箱" fullWidth onChange={(e) => setEmail(e.target.value)} />
                <TextField label="密码" type="password" fullWidth onChange={(e) => setPassword(e.target.value)} />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <TextField
                    label="验证码"
                    fullWidth
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                  />
                  {captchaUrl && (
                    <img
                      src={captchaUrl}
                      alt="验证码"
                      style={{ height: '40px', cursor: 'pointer' }}
                      onClick={refreshCaptcha}
                    />
                  )}
                </div>
                <Button variant="contained" fullWidth onClick={() => handleLogin()}>
                  {loginLoading ? <CircularProgress size={24} /> : '登录'}
                </Button>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Button variant="outlined" fullWidth onClick={() => setIsRegistering(true)}>
                    {registerLoading ? <CircularProgress size={24} /> : '注册'}
                  </Button>
                  <Divider style={{ margin: "0 10px" }}>或</Divider>
                  <Button variant="outlined" fullWidth onClick={() => setIsGuest(true)}>
                    访客模式
                  </Button>
                </div>
              </>
            ) : (
              <>
                <TextField label="邮箱" type="email" fullWidth onChange={(e) => setEmail(e.target.value)} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <TextField
                    label="验证码"
                    fullWidth
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    disabled={countdown > 0}
                    onClick={sendEmailCode}
                  >
                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </Button>
                </div>
                <TextField label="密码" type="password" fullWidth onChange={(e) => setPassword(e.target.value)} />
                <TextField label="确认密码" type="password" fullWidth onChange={(e) => setConfirmPassword(e.target.value)} />
                <TextField label="用户名" fullWidth onChange={(e) => setUsername(e.target.value)} />
                <Button variant="contained" fullWidth onClick={handleRegister}>
                  {registerLoading ? <CircularProgress size={24} /> : '注册'}
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
               <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <TextField
                    label="验证码"
                    fullWidth
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                  />
                  {captchaUrl && (
                    <img
                      src={captchaUrl}
                      alt="验证码"
                      style={{ height: '40px', cursor: 'pointer' }}
                      onClick={refreshCaptcha}
                    />
                  )}
                </div>
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