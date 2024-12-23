import { styled } from '@mui/material/styles';
import { Box, TextField, Button, Paper, IconButton, Typography, Avatar } from '@mui/material';

export const ChatContainer = styled(Box)({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#f0f2f5',
    position: 'relative'
});

export const MessagesContainer = styled(Box)({
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%'
});

export const InputContainer = styled(Box)({
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 20px',
    backgroundColor: '#fff',
    borderTop: '1px solid rgba(0, 0, 0, 0.12)',
    zIndex: 1000,
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%'
});

export const StyledRoot = styled('div')({
  display: 'flex',
  minHeight: '100vh',
});

export const StyledMain = styled('div')({
  flexGrow: 1,
  overflow: 'auto',
  minHeight: '100vh',
  paddingTop: 64,
  paddingBottom: 24,
});