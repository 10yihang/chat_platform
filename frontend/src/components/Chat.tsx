/*
 * @author: yihang_01
 * @Date: 2024-12-26 00:55:48
 * @LastEditTime: 2024-12-26 16:10:38
 * QwQ 加油加油
 */
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useSocketContext } from '../contexts/SocketContextProvider';
import { ChatContainer } from '../styles';
import { ChatProps } from '../types';
import UserProfileDialog from './UserProfileDialog';
import MessageList from './chat/MessageList';
import MessageInput from './chat/MessageInput';
import Whiteboard from './Whiteboard';
import { useChat } from '../hooks/useChat';
import { useRoomId } from '../hooks/useRoomId';
import { message } from 'antd';
import { Message } from '../types';
import AISuggestion from './chat/AISuggestion';
import { channel } from 'diagnostics_channel';

const Chat: React.FC<ChatProps> = ({ channelId, groupId, friendId, avatar }) => {
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const { socket } = useSocketContext();
    const { chatRoomId, whiteBoardRoomId } = useRoomId(channelId, groupId, friendId);
    const { messages, sendMessage } = useChat(socket, chatRoomId, channelId, groupId, friendId);
    const [showAiSuggestion, setShowAiSuggestion] = useState(false);
    const [selectedModel, setSelectedModel] = useState('doubao');  

    // console.log(channelId, groupId, friendId);

    const handleSendMessage = async (content: string) => {
        try {
            await sendMessage(content);
        } catch (error) {
            message.error((error as Error).message);
        }
    };

    const handleAvatarClick = (userId: number) => {
        setSelectedUserId(userId);
        setProfileDialogOpen(true);
    };

    const handleRequestAiSuggestion = (model: string) => {
        console.log('Chat received model:', model);
        setSelectedModel(model);
        setShowAiSuggestion(true);
    };

    return (
        <ChatContainer>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <MessageList
                    messages={messages}
                    onAvatarClick={handleAvatarClick}
                />
            </Box>

            {showWhiteboard && (
                <Whiteboard
                    roomId={Array.isArray(whiteBoardRoomId) ? whiteBoardRoomId[0] : whiteBoardRoomId}
                    onClose={() => setShowWhiteboard(false)}
                />
            )}

            <UserProfileDialog
                open={profileDialogOpen}
                onClose={() => setProfileDialogOpen(false)}
                userId={selectedUserId || 0}
            />

            {showAiSuggestion && (
                <AISuggestion
                    messages={messages}
                    onSend={handleSendMessage}
                    onClose={() => setShowAiSuggestion(false)}
                    model={selectedModel}  // 使用选中的模型
                />
            )}

            <MessageInput
                onSend={handleSendMessage}
                onWhiteboardToggle={() => setShowWhiteboard(!showWhiteboard)}
                socket={socket}
                roomId={chatRoomId}
                friendId={friendId}
                groupId={groupId}
                channelId={channelId}
                onRequestAiSuggestion={handleRequestAiSuggestion}
                onClose={() => setShowAiSuggestion(false)} // 添加onClose属性
            />
        </ChatContainer>
    );
};

export default Chat;