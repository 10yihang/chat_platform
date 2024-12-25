import React, { useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
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
    const [newMessage, setNewMessage] = useState('');

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
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FileUploader
                    socket={socket}
                    roomId={roomId}
                    messageData={messageData}
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
