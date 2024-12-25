import React, { useState } from 'react';
import { Box, TextField, IconButton, LinearProgress, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CreateIcon from '@mui/icons-material/Create';
import FileUploader from './FileUploader';
import VoiceCall from '../VoiceCall';
import VideoCall from '../VideoCall';

interface MessageInputProps {
    onSend: (message: string) => void;
    onWhiteboardToggle: () => void;
    socket: any;
    roomId: string | string[];
    friendId?: string;
    groupId?: string;
    channelId?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    onWhiteboardToggle,
    socket,
    roomId,
    friendId,
    groupId,
    channelId
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [newMessage, setNewMessage] = useState('');

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

    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            {isUploading && (
                <Box sx={{ 
                    position: 'absolute', 
                    top: -24,  // 调整位置，为文字留出空间
                    left: 0, 
                    right: 0,
                    zIndex: 1 
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 0.5  // 添加文字和进度条之间的间距
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
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: isUploading ? 4 : 0 }}>
                <FileUploader
                    socket={socket}
                    roomId={roomId}
                    messageData={messageData}
                    onUploadProgress={handleUploadProgress}
                />
                
                <IconButton onClick={onWhiteboardToggle}>
                    <CreateIcon />
                </IconButton>

                <VoiceCall
                    friendId={friendId}
                    userName={localStorage.getItem('userName') || ''}
                    groupId={groupId}
                />
                <VideoCall
                    friendId={friendId}
                    userName={localStorage.getItem('userName') || ''}
                    groupId={groupId}
                />

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
            </Box>
        </Box>
    );
};

export default MessageInput;
