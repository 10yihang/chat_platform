import React, { useEffect, useRef, useState } from 'react';
import { 
  Chip, 
  Box, 
  CircularProgress, 
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CancelIcon from '@mui/icons-material/Cancel';
import { motion } from 'framer-motion';
import { message } from 'antd';

export interface AISuggestionProps {
  messages: any[];
  onSend: (text: string) => void;
  onClose: () => void;
  model?: string; // 添加model参数
}

const AISuggestion: React.FC<AISuggestionProps> = ({ 
  messages, 
  onSend,
  onClose,
  model = 'doubao' // 默认使用doubao
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 10000; 
  const [openDialog, setOpenDialog] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!messages.length) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender_id.toString() === localStorage.getItem('userId')) {
      setSuggestion('等待对方回复...');
      return;
    }
    
    fetchAiSuggestion();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [messages.length]); // 只在消息数量变化时触发

  const fetchAiSuggestion = async () => {
    if (isRequesting) return; // 防止重复请求
    setIsRequesting(true);
    try {
      console.log('Fetching AI suggestion with model:', model);
      setLoading(true);
      setSuggestion('');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), TIMEOUT_MS);
      });

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      console.log('Fetching AI suggestion...');
      const requestBody = {
        messages: messages.slice(Math.max(-messages.length, -15)),
        current_user_id: localStorage.getItem('userId'),
        model: model
      };
      console.log('Request body:', requestBody);

      const fetchPromise = fetch(`${global.preUrl}/api/ai/suggest/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });


      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        console.error('Response not OK:', response.status);
        message.error('获取AI建议失败');
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.error('No reader available');
        return;
      }

      console.log('Starting to read stream...');
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        console.log('Received text:', text);

        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('Parsed data:', data);
              if (data.content) {
                setSuggestion(prev => {
                  const newSuggestion = prev + data.content;
                  console.log('Updated suggestion:', newSuggestion);
                  return newSuggestion;
                });
              }
              if (data.error) {
                console.error('Error from server:', data.error);
              }
            } catch (e) {
              console.error('解析数据失败:', e, 'Raw line:', line);
            }
          }
        }
      }
      
      setRetryCount(0); // 成功后重置重试次数
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      
      console.error('获取AI建议失败:', error);
      
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        message.info(`正在重试 (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 指数退避
        // return; // 使用return确保不会继续执行
      } else {
        message.error('获取AI建议失败，请稍后重试');
        onClose();
      }
    } finally {
      setLoading(false); 
      setIsRequesting(false);
    }
  };

  const handleChipClick = () => {
    if (!loading && suggestion) {
      setOpenDialog(true);
    }
  };

  const handleSendAndClose = () => {
    onSend(suggestion);
    setOpenDialog(false);
  };

  const getPreviewText = (text: string) => {
    if (loading) return "AI正在思考...";
    if (!text) return '正在准备中...';
    const maxLength = 50;
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  if (!messages.length) return null;

  return (
    <>
      <Box 
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          p: 1,
          position: 'relative',
          top: -1,
          backgroundColor: '#fff',
          borderTop: '1px solid rgba(0, 0, 0, 0.12)'
        }}
      >
        <Stack direction="row" spacing={1} sx={{ width: 'auto' }}>
          <Chip
            icon={loading ? <CircularProgress size={16} /> : <SmartToyIcon />}
            label={getPreviewText(suggestion)}
            onClick={handleChipClick}
            variant="outlined"
            clickable={!loading && !!suggestion}
            color="primary"
            sx={{
              maxWidth: {
                xs: 280, 
                sm: 400, 
                md: 500  
              },
              height: 'auto',
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                padding: '8px 8px'
              }
            }}
          />
          <Chip
            icon={<CancelIcon />}
            label="关闭"
            onClick={onClose}
            variant="outlined"
            color="error"
            clickable
          />
        </Stack>
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          完整AI建议
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>
            {suggestion}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            取消
          </Button>
          <Button onClick={handleSendAndClose} color="primary" variant="contained">
            发送此回复
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AISuggestion;