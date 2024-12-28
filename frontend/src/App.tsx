import React, { useState} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatApp from './pages/ChatApp';
import PublicChannel from './pages/PublicChannel';
import FriendList from './pages/FriendList';
import Profile from './pages/Profile';
import VideoCall from './components/VideoCall';
import Settings from './pages/Settings';
import { Box, CircularProgress } from '@mui/material';
import SocketProvider, { useSocketContext } from './contexts/SocketContextProvider';
import theme from './theme/theme';

declare global {
  var preUrl: string;
  var socketUrl: string;
}

global.preUrl = 'https://chat.yihang01.cn:5000';
global.socketUrl = 'wss://chat.yihang01.cn:5000';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);


  const handleLogin = (isGuestLogin?: boolean) => {
    setIsAuthenticated(true);
    setIsGuest(isGuestLogin || false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsGuest(false);
    localStorage.removeItem('token');
  };

  function isTokenExpired(token: string) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp && Date.now() >= payload.exp * 1000;
    } catch {
      return true; 
    }
  }

  // 检查用户认证状态
  React.useEffect(() => {

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token && !isTokenExpired(token)) {
          setIsAuthenticated(true);
          return;
        }
        localStorage.removeItem('token');
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {!isAuthenticated ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <SocketProvider>
            <Layout onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Navigate to="/chat/group/1" replace />} />
                <Route path="/chat" element={<Navigate to="/chat/group/1" replace />} />
                <Route path="/chat/group/:id" element={<ChatApp />} />
                <Route path="/chat/friend/:id" element={<ChatApp />} />
                {!isGuest && (
                  <>
                    {/* <Route path="/chat/:id" element={<ChatApp />} /> */}
                    <Route path="/friends" element={<FriendList />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                  </>
                )}
                <Route path="/channel" element={<PublicChannel />} />
                {/* <Route path="/video-call/:id" element={<VideoCall />} /> */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </SocketProvider>
        )}
      </Router>
    </ThemeProvider>
  );
};

export default App;