import React, { useState} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatApp from './pages/ChatApp';
import PublicChannel from './pages/PublicChannel';
import FriendList from './pages/FriendList';
import Profile from './pages/Profile';
import FileSharing from './pages/FileSharing';
import VideoCall from './components/VideoCall';
import Settings from './pages/Settings';
import { Box, CircularProgress } from '@mui/material';
import { message } from 'antd';
import SocketProvider, { useSocketContext } from './contexts/SocketContextProvider';

declare global {
  var preUrl: string;
  var socketUrl: string;
}

global.preUrl = 'http://10.255.253.3:5000';
global.socketUrl = 'ws://10.255.253.3:5000';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#128C7E',  // WhatsApp绿色
      light: '#25D366',
      dark: '#075E54',
    },
    secondary: {
      main: '#34B7F1',  // WhatsApp蓝色
    },
    background: {
      default: '#FFFFFF',
      paper: '#F0F2F5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Arial',
      'sans-serif'
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

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

  // 检查用户认证状态
  React.useEffect(() => {

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // TODO: 验证 token
          setIsAuthenticated(true);
        }
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
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route path="/chat" element={<ChatApp />} />
                <Route path="/chat/group/:id" element={<ChatApp />} />
                <Route path="/chat/friend/:id" element={<ChatApp />} />
                {!isGuest && (
                  <>
                    <Route path="/chat/:id" element={<ChatApp />} />
                    <Route path="/friends" element={<FriendList />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/files" element={<FileSharing />} />
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