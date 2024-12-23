import { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import Navigation from './Navigation';
import { LayoutProps } from '../types';
import {StyledRoot, StyledMain} from '../styles';

const Layout: React.FC<LayoutProps> = ({ children, onLogout = () => {}, socket }) => {
  useEffect(() => {
    const checkSocket = async () => {
      if (socket) {
        socket.on('message', (data: any) => {
          console.log('Layout收到消息:', data);
        });
      }
  
      return () => {
        if (socket) {
          socket.off('message');
        }
      };
    };
  })


  return (
    <StyledRoot>
      <AppBar position="fixed">
        <Toolbar>
          <Navigation onLogout={onLogout} socket={socket} />
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
