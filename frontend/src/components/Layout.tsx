import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import Navigation from './Navigation';

const StyledRoot = styled('div')({
  display: 'flex',
  minHeight: '100vh',
});

const StyledMain = styled('div')({
  flexGrow: 1,
  overflow: 'auto',
  minHeight: '100vh',
  paddingTop: 64,
  paddingBottom: 24,
});

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <StyledRoot>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6">聊天室</Typography>
          <Navigation />
        </Toolbar>
      </AppBar>
      <StyledMain>
        <Container maxWidth="lg">
          <Box sx={{ py: 3 }}>
            {children}
          </Box>
        </Container>
      </StyledMain>
    </StyledRoot>
  );
};

export default Layout;