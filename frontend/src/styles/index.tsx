import { styled } from '@mui/material/styles';
import { Badge, Box, TextField, Button, Paper, IconButton, Typography, Avatar } from '@mui/material';

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

export const MessageContent = styled(Box)<{ isown: boolean }>(({ isown }) => ({
  fontSize: '0.9rem',
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  flex: '0 1 auto'
}));

export const MessageWrapper = styled(Box)<{ isown: boolean }>(({ isown }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: '12px',
  flexDirection: isown ? 'row-reverse' : 'row',
  gap: '8px',
  width: '100%',
  padding: '0 20px'
}));

export const MessageBubbleContainer = styled(Paper)<{ isown: boolean }>(({ isown, theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: '12px',
  minWidth: '120px',
  backgroundColor: isown ? '#dcf8c6' : '#fff',
  boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
}));

export const MessageText = styled(Typography)({
  fontSize: '0.9rem',
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word'
});

export const MessageTime = styled(Typography)({
  fontSize: '0.75rem',
  color: '#667781',
  marginTop: '4px',
  textAlign: 'right'
});


export const UserAvatar = styled(Avatar)({
  width: 40,
  height: 40
});

export const UserName = styled(Typography)({
  fontSize: '0.8rem',
  color: '#667781',
  marginBottom: '4px'
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

export const OnlineBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
}));