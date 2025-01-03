import React, { useState, useRef } from 'react';
import { Box, TextField, IconButton, LinearProgress, Typography, Stack, Collapse, Tooltip, Select, MenuItem } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CreateIcon from '@mui/icons-material/Create';
import FileUploader from './FileUploader';
import VoiceCall from '../VoiceCall';
import VideoCall from '../VideoCall';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ForumIcon from '@mui/icons-material/Forum';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { InputContainer } from '../../styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface MessageInputProps {
    onSend: (message: string) => void;
    onWhiteboardToggle: () => void;
    socket: any;
    roomId: string | string[];
    friendId?: string;
    groupId?: string;
    channelId?: string;
    onRequestAiSuggestion?: (model: string) => void;
    onClose?: () => void; // 添加可选的onClose属性
}

const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    onWhiteboardToggle,
    socket,
    roomId,
    friendId,
    groupId,
    channelId,
    onRequestAiSuggestion,  // 新增属性
    onClose  // 解构onClose
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showTools, setShowTools] = useState(false);
    const [selectedModel, setSelectedModel] = useState('doubao'); // 默认使用doubao模型

    const handleUploadProgress = (uploading: boolean, progress: number) => {
        setIsUploading(uploading);
        setUploadProgress(progress);
    };

    const handleSend = () => {
        if (!newMessage.trim()) return;
        onSend(newMessage);
        setNewMessage('');
    };

    const messageData = {
        sender_id: parseInt(localStorage.getItem('userId') || '0'),
        receiver_id: friendId ? parseInt(friendId) : 0,
        group_id: groupId ? parseInt(groupId) : channelId === 'public' ? 1 : 0,
        sender_name: localStorage.getItem('userName') || '',
        room: roomId
    };

    const ToolButtons = () => (
        <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="表情">
                <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <EmojiEmotionsIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="白板">
                <IconButton onClick={onWhiteboardToggle}>
                    <CreateIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="AI建议">
                <IconButton 
                    onClick={handleRequestAiSuggestion} 
                    color="primary"
                    data-ai-button="true"
                    data-active="false"
                >
                    <SmartToyIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="文件上传">
                <Box component="span">
                    <FileUploader
                        socket={socket}
                        roomId={roomId}
                        messageData={messageData}
                        onUploadProgress={handleUploadProgress}
                    />
                </Box>
            </Tooltip>
            <Tooltip title="语音通话">
                <Box component="span">
                    <VoiceCall
                        friendId={friendId}
                        userName={localStorage.getItem('userName') || ''}
                        groupId={groupId}
                    />
                </Box>
            </Tooltip>
            <Tooltip title="视频通话（暂不可用）">
                <span>  {/* 使用span替代Box以保持禁用状态的样式 */}
                    <IconButton disabled sx={{ opacity: 0.5 }}>  {/* 添加disabled属性和透明度 */}
                        <VideoCall
                            friendId={friendId}
                            userName={localStorage.getItem('userName') || ''}
                            groupId={groupId}
                        />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title="选择AI模型">
                <Select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    size="small"
                    sx={{
                        height: '32px',
                        minWidth: '120px',
                        '.MuiSelect-select': {
                            py: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                        }
                    }}
                >
                    <MenuItem value="doubao">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <SmartToyIcon fontSize="small" />
                            <span>豆包</span>
                        </Stack>
                    </MenuItem>
                    <MenuItem value="gemini" disabled>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <SmartToyIcon fontSize="small" />
                            <span>Gemini</span>
                        </Stack>
                    </MenuItem>
                    <MenuItem value="deepseek">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <SmartToyIcon fontSize="small" />
                            <span>DeepSeek</span>
                        </Stack>
                    </MenuItem>
                    <MenuItem value="grok">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <SmartToyIcon fontSize="small" />
                            <span>Grok2</span>
                        </Stack>
                    </MenuItem>
                    <MenuItem value="Baidu" disabled>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <SmartToyIcon fontSize="small" />
                            <span>千帆</span>
                        </Stack>
                    </MenuItem>
                </Select>
            </Tooltip>
        </Stack>
    );

    const handleRequestAiSuggestion = () => {
        if (onRequestAiSuggestion) {
            const aiButton = document.querySelector('[data-ai-button="true"]');
            const isActive = aiButton?.getAttribute('data-active') === 'true';
            
            if (isActive) {
                // 如果已经激活，则关闭
                aiButton?.setAttribute('data-active', 'false');
                if (onClose) onClose(); // 安全调用onClose
            } else {
                // 如果未激活，则开启
                aiButton?.setAttribute('data-active', 'true');
                onRequestAiSuggestion(selectedModel);
            }
        }
    };

    return (
        <InputContainer>
            {showEmojiPicker && (
                <Box sx={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 1 }}>
                    <Picker data={data} onEmojiSelect={(emoji: any) => {
                        setNewMessage(prev => prev + emoji.native);
                        setShowEmojiPicker(false);
                    }} />
                </Box>
            )}
            
            <Collapse in={showTools}>
                <Box sx={{ py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
                    <ToolButtons />
                </Box>
            </Collapse>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <Tooltip title={showTools ? "收起工具" : "展开工具"}>
                    <IconButton onClick={() => setShowTools(!showTools)}>
                        <MoreVertIcon />
                    </IconButton>
                </Tooltip>

                <TextField
                    fullWidth
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="输入消息..."
                    multiline
                    maxRows={4}
                    size="small"
                />
                
                <IconButton onClick={handleSend} color="primary">
                    <SendIcon />
                </IconButton>
            </Stack>

            {isUploading && (
                <Box sx={{ 
                    position: 'absolute', 
                    top: -24,
                    left: 0, 
                    right: 0,
                    zIndex: 1 
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 0.5
                    }}>
                        <Typography variant="caption" color="primary">
                            {`上传进度: ${Math.round(uploadProgress)}%`}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                        sx={{ 
                            width: '100%',
                            height: 4,
                            borderRadius: 1
                        }}
                    />
                </Box>
            )}
        </InputContainer>
    );
};

export default MessageInput;
