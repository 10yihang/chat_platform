import React, { useMemo } from 'react';
import { Typography, Avatar, Box, Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Message } from '../types';
import AttachFileIcon from '@mui/icons-material/AttachFile';

interface MessageBubbleProps {
  message: Message;
  isown: boolean;
  avatar?: string;
  onAvatarClick?: () => void;
}

const MessageWrapper = styled(Box)<{ isown: boolean }>(({ isown }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px',
    flexDirection: isown ? 'row-reverse' : 'row',
    gap: '8px',
    width: '100%',
    padding: '0 20px'
}));

const UserAvatar = styled(Avatar)({
  width: 40,
  height: 40
});

const MessageContent = styled(Box)<{ isown: boolean }>(({ isown }) => ({
    fontSize: '0.9rem',
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    flex: '0 1 auto'
}));

const MessageBubbleContainer = styled(Paper)<{ isown: boolean }>(({ isown, theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: '12px',
  minWidth: '120px',
  backgroundColor: isown ? '#dcf8c6' : '#fff',
  boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
}));

const UserName = styled(Typography)({
    fontSize: '0.8rem',
    color: '#667781',
    marginBottom: '4px'
});

const MessageText = styled(Typography)({
  fontSize: '0.9rem',
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word'
});

const MessageTime = styled(Typography)({
  fontSize: '0.75rem',
  color: '#667781',
  marginTop: '4px',
  textAlign: 'right'
});

const formatTime = (createdAt: string) => {
  const messageDate = new Date(createdAt);
  const now = new Date();
  
  messageDate.setHours(messageDate.getHours());
  
  const isToday = messageDate.toDateString() === now.toDateString();
  
  if (isToday) {
    return messageDate.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return messageDate.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isown, avatar, onAvatarClick }) => {
  const renderContent = () => {
    switch (message.type) {
      case 'file':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachFileIcon />
            <Button
              variant="text"
              href={`${global.preUrl}${message.file_url}`}
              target="_blank"
              download
              sx={{ color: 'inherit', textTransform: 'none' }}
            >
              {message.content}
            </Button>
          </Box>
        );
      default:
        return message.content;
    }
  };

  return (
    <MessageWrapper isown={isown}>
      <UserAvatar src={avatar} onClick={onAvatarClick} />
      <MessageContent isown={isown}>
        {!isown && <UserName>{message.sender_name}</UserName>}
        <MessageBubbleContainer isown={isown}>
          {renderContent()}
          <MessageTime>
            {formatTime(message.created_at)}
          </MessageTime>
        </MessageBubbleContainer>
      </MessageContent>
    </MessageWrapper>
  );
};

export default React.memo(MessageBubble);