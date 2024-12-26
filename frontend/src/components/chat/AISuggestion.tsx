import React, { useEffect, useRef, useState } from 'react';
import { Chip, Box, CircularProgress, Stack } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CancelIcon from '@mui/icons-material/Cancel';
import { motion } from 'framer-motion';
import { message } from 'antd';

export interface AISuggestionProps {
  messages: any[];
  onSend: (text: string) => void;
  onClose: () => void;
}

const AISuggestion: React.FC<AISuggestionProps> = ({ 
  messages, 
  onSend,
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

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
    try {
      setLoading(true);
      setSuggestion('');
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      console.log('Fetching AI suggestion...');
      const response = await fetch(`${global.preUrl}/api/ai/suggest/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          messages: messages.slice(Math.max(-messages.length, -15)),
          current_user_id: localStorage.getItem('userId'),
          model: 'Gemini',
        }),
        signal: abortControllerRef.current.signal,
      });

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
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('获取AI建议失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!messages.length) return null;

  return (
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
        {loading ? (
          <>
            <Chip
              icon={<CircularProgress size={16} />}
              label="AI正在思考..."
              variant="outlined"
            />
            <Chip
              icon={<CancelIcon />}
              label="取消"
              onClick={onClose}
              variant="outlined"
              color="error"
              clickable
            />
          </>
        ) : (
          <>
            <Chip
              icon={<SmartToyIcon />}
              label={suggestion || '正在思考中...'}
              onClick={() => suggestion && onSend(suggestion)}
              variant="outlined"
              clickable
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
          </>
        )}
      </Stack>
    </Box>
  );
};

export default AISuggestion;