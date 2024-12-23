import { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import Navigation from './Navigation';
import { LayoutProps } from '../types';
import {StyledRoot, StyledMain} from '../styles';

const Layout: React.FC<LayoutProps> = ({ children, onLogout = () => {}}) => {

  return (
    <StyledRoot>
      <AppBar position="fixed">
        <Toolbar>
          <Navigation onLogout={onLogout}/>
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
