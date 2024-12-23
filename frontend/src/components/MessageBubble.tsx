import React, { useMemo, useState } from 'react';
import { Typography, Avatar, Box, Paper, Button, Dialog, DialogContent, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Message, MessageBubbleProps } from '../types';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import DescriptionIcon from '@mui/icons-material/Description';
import GetAppIcon from '@mui/icons-material/GetApp';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import {MessageTime, MessageText, MessageWrapper, UserAvatar, MessageContent, UserName, MessageBubbleContainer} from '../styles';
import { message as messageAlert } from 'antd';

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');

  const getFileType = (filename: string): 'image' | 'video' | 'text' | 'music' | 'unknown' => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExts = ['mp4', 'webm', 'ogg'];
    const musicExts = ['mp3', 'wav', 'flac', 'ape', 'alac'];
    const textExts = ['txt', 'html', 'css', 'js', 'json', 'md', 'py', 'c', 'cpp'];

    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    if (textExts.includes(ext)) return 'text';
    if (musicExts.includes(ext)) return 'music';
    return 'unknown';
  };

  const handleDownload = async (message: Message) => {
    try {
      const response = await fetch(`${global.preUrl}/api/file${message.file_url}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.content;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载文件失败:', error);
      messageAlert.error('下载文件失败');
    }
  };

  const handlePreview = async (message: Message) => {
    if (!message.file_url) return;

    try {
      const response = await fetch(`${global.preUrl}/api/file${message.file_url}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const fileType = getFileType(message.content);
      if (fileType === 'text') {
        const text = await response.text();
        setPreviewContent(text);
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPreviewContent(url);
      }
      setPreviewOpen(true);
    } catch (error) {
      console.error('预览文件失败:', error);
      messageAlert.error('预览文件失败');
    }
  };

  const renderFileIcon = (filename: string) => {
    const fileType = getFileType(filename);
    switch (fileType) {
      case 'image': return <ImageIcon />;
      case 'video': return <VideoFileIcon />;
      case 'text': return <DescriptionIcon />;
      case 'music': return <AudioFileIcon />;
      default: return <AttachFileIcon />;
    }
  };

  const renderPreview = () => {
    const fileType = getFileType(message.content);
    switch (fileType) {
      case 'image':
        return <img src={previewContent} alt={message.content} style={{ maxWidth: '100%', maxHeight: '80vh' }} />;
      case 'video':
        return <video src={previewContent} controls style={{ maxWidth: '100%', maxHeight: '80vh' }} />;
      case 'text':
        return <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '80vh', overflow: 'auto' }}>{previewContent}</pre>;
        case 'music':
          return (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', p: 2 }}>
              <audio controls style={{ width: '100%', maxWidth: '500px' }}>
                <source src={previewContent} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </Box>
          );
        default:
        return null;
    }
  };

  const renderContent = () => {
    if (message.type === 'file') {
      const fileType = getFileType(message.content);
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {renderFileIcon(message.content)}
          <Button
            variant="text"
            onClick={() => handlePreview(message)}
            sx={{ color: 'inherit', textTransform: 'none' }}
          >
            {message.content}
          </Button>
          {fileType === 'unknown' && (
            <IconButton size="small" onClick={() => handleDownload(message)}>
              <GetAppIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      );
    }
    return message.content;
  };

  return (
    <>
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

      <Dialog
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          if (getFileType(message.content) !== 'text') {
            window.URL.revokeObjectURL(previewContent);
          }
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent>
          {renderPreview()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default React.memo(MessageBubble);