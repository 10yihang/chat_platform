import React from 'react';
import { Chip, Box, CircularProgress, Stack } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CancelIcon from '@mui/icons-material/Cancel';
import { motion } from 'framer-motion';

export interface AISuggestionProps {
  suggestion: string;
  loading: boolean;
  onSend: (text: string) => void;
  onCancel: () => void;
}

const AISuggestion: React.FC<AISuggestionProps> = ({ 
  suggestion, 
  loading, 
  onSend,
  onCancel 
}) => {
  if (!suggestion && !loading) return null;

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
              onClick={onCancel}
              variant="outlined"
              color="error"
              clickable
            />
          </>
        ) : (
          <>
            <Chip
              icon={<SmartToyIcon />}
              label={suggestion}
              onClick={() => suggestion && onSend(suggestion)}
              variant="outlined"
              clickable
              color="primary"
            />
            <Chip
              icon={<CancelIcon />}
              label="关闭"
              onClick={onCancel}
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
