import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Paper, IconButton, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { styled } from '@mui/material/styles';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  group_id: number;
  content: string;
  type: 'text' | 'emoji' | 'file';
  created_at: string;
  status: string;
  file_url?: string;
}

interface ChatProps {
  channelId?: string;
  groupId?: string;
  friendId?: string;
}

const MessageBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  maxWidth: '70%',
  wordBreak: 'break-word'
}));

const Chat: React.FC<ChatProps> = ({ channelId, groupId, friendId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const fileInputRef = useRef<null | HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    // try {
    //   const userId = localStorage.getItem('userId');
    //   const response = await fetch(`${global.preUrl}/api/chat/receive/${userId}`);
    //   const data = await response.json();
    //   setMessages(data);
    // } catch (error) {
    //   console.error('获取消息失败:', error);
    // }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    console.log(newMessage);

    try {
      const messageData = {
        sender_id: localStorage.getItem('userId'),
        receiver_id: friendId ? parseInt(friendId) : 0,
        group_id: groupId ? parseInt(groupId) : channelId === 'public' ? 1 : 0,
        content: newMessage,
        type: 'text',
        status: 'sent'
      };

      const response = await fetch(`${global.preUrl}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setNewMessage('');
        await fetchMessages();
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await fetch(`${global.preUrl}/api/media/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (uploadResponse.ok) {
        const { file_url } = await uploadResponse.json();
        await fetch(`${global.preUrl}/api/chat/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender_id: localStorage.getItem('userId'),
            receiver_id: 0,
            group_id: 1,
            content: file.name,
            type: 'file',
            file_url,
            status: 'sent'
          }),
        });
        await fetchMessages();
      }
    } catch (error) {
      console.error('上传文件失败:', error);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.sender_id.toString() === localStorage.getItem('userId')
                ? 'flex-end'
                : 'flex-start'
            }}
          >
            <MessageBox>
              <Typography variant="body1">{message.content}</Typography>
              {message.type === 'file' && message.file_url && (
                <Button href={message.file_url} target="_blank">
                  下载文件
                </Button>
              )}
            </MessageBox>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <IconButton onClick={() => fileInputRef.current?.click()}>
            <AttachFileIcon />
          </IconButton>
          <TextField
            fullWidth
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="输入消息..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <IconButton onClick={handleSend} color="primary">
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;