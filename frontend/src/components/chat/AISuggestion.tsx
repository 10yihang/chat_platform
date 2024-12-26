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
  const TIMEOUT_MS = 30000; // 30秒超时
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fullSuggestion, setFullSuggestion] = useState('');

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  useEffect(() => {
    if (!messages.length) return;
    
    // 获取最后一条消息
    const lastMessage = messages[messages.length - 1];
    // 如果最后一条消息是自己发的，则不提供建议
    if (lastMessage.sender_id.toString() === localStorage.getItem('userId')) {
      setSuggestion('等待对方回复...');
      return;
    }
    
    fetchAiSuggestion();
  }, [messages]);

  const fetchAiSuggestion = async () => {
    let retryTimeout: NodeJS.Timeout;
    try {
      console.log('Fetching AI suggestion with model:', model);
      setLoading(true);
      setSuggestion('');
      
      // 创建超时Promise
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

      // 使用Promise.race进行超时控制
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
                  setFullSuggestion(newSuggestion); // 保存完整建议
                  console.log('Updated suggestion:', newSuggestion);
                  return newSuggestion;
                });
              }
              if (data.error) {
                console.error('Error from server:', data.error);
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('解析数据失败:', e, 'Raw line:', line);
              throw e; // 抛出错误以触发重试
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
      
      // 处理重试逻辑
      if (retryCount < MAX_RETRIES) {
        const nextRetryCount = retryCount + 1;
        setRetryCount(nextRetryCount);
        message.info(`正在重试 (${nextRetryCount}/${MAX_RETRIES})...`);
        retryTimeout = setTimeout(fetchAiSuggestion, 1000); // 1秒后重试
      } else {
        message.error('获取AI建议失败，请稍后重试');
        setRetryCount(0); // 重置重试计数
        onClose();
      }
    } finally {
      setLoading(false);
      return () => {
        if (retryTimeout) clearTimeout(retryTimeout);
      };
    }
  };

  // 清理函数
  useEffect(() => {
    return () => {
      setRetryCount(0);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
        <Stack direction="row" spacing={1}>
          <Chip
            icon={loading ? <CircularProgress size={16} /> : <SmartToyIcon />}
            label={loading ? "AI正在思考..." : (truncateText(suggestion) || '正在思考中...')}
            onClick={() => {
              if (!loading && suggestion) {
                if (suggestion.length > 50) {
                  setIsDialogOpen(true);
                } else {
                  onSend(suggestion);
                }
              }
            }}
            variant="outlined"
            clickable={!loading && !!suggestion}
            color="primary"
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
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>AI建议</DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>
            {fullSuggestion}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>取消</Button>
          <Button 
            onClick={() => {
              onSend(fullSuggestion);
              setIsDialogOpen(false);
            }} 
            variant="contained"
          >
            使用此建议
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AISuggestion;