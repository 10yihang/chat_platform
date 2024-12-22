import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Button, Stack } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

interface NavigationProps {
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  };

  return (
    <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
      <Button color="inherit" component={RouterLink} to="/">
        主页
      </Button>
      <Button color="inherit" component={RouterLink} to="/room">
        聊天室
      </Button>
      <Button
        color="inherit"
        onClick={handleLogout}
        startIcon={<LogoutIcon />}
      >
        退出
      </Button>
    </Stack>
  );
};

export default Navigation;