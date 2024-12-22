import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Paper, IconButton, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { styled } from '@mui/material/styles';
import { useSocket } from '../hooks/useSocket';

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
  const socket = useSocket(global.socketUrl);
  const roomId = groupId || channelId || `private_${friendId}`;

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

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`${global.preUrl}/api/chat/history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: localStorage.getItem('userId'),
            groupId: groupId || (channelId === 'public' ? 1 : null),
            friendId: friendId
          })
        });
        
        const data = await response.json();
        setMessages(data.reverse()); // 反转消息顺序以显示最新消息在底部
      } catch (error) {
        console.error('获取历史消息失败:', error);
      }
    };

    loadHistory();
    
    if (socket) {
      socket.on('message', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });
    }

    return () => {
      socket?.off('message');
    };
  }, [socket, channelId, groupId, friendId]);

  useEffect(() => {
    if (socket) {
      socket.on('message', (newMsg: Message) => {
        console.log('收到新消息:', newMsg);
        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();
      });

      socket.on('error', (error: any) => {
        console.error('Socket错误:', error);
      });

      return () => {
        socket.off('message');
        socket.off('error');
      };
    }
  }, [socket]);

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
    console.log(localStorage.getItem('userId'));

    if(!localStorage.getItem('userId') || localStorage.getItem('userId') === 'undefined') {
        alert('请先登录');
        return;
    }

    const messageData = {
      sender_id: parseInt(localStorage.getItem('userId') || '0'),
      receiver_id: friendId ? parseInt(friendId) : 0,
      group_id: groupId ? parseInt(groupId) : channelId === 'public' ? 1 : 0,
      content: newMessage,
      type: 'text',
      room: roomId
    };

    try {
      socket?.emit('chat', { message: messageData, room: roomId });
      setNewMessage('');
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