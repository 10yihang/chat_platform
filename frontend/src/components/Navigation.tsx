import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Stack } from '@mui/material';

const Navigation: React.FC = () => {
  return (
    <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
      <Button color="inherit" component={RouterLink} to="/">
        主页
      </Button>
      <Button color="inherit" component={RouterLink} to="/room">
        聊天室
      </Button>
    </Stack>
  );
};

export default Navigation;