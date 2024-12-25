import React, { useState } from 'react';
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

const Chat: React.FC<ChatProps> = ({ channelId, groupId, friendId, avatar }) => {
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const { socket } = useSocketContext();
    const { chatRoomId, whiteBoardRoomId } = useRoomId(channelId, groupId, friendId);
    const { messages, sendMessage } = useChat(socket, chatRoomId, channelId, groupId, friendId);

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

    return (
        <ChatContainer>
            <MessageList
                messages={messages}
                avatar={avatar}
                onAvatarClick={handleAvatarClick}
            />

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

            <MessageInput
                onSend={handleSendMessage}
                onWhiteboardToggle={() => setShowWhiteboard(!showWhiteboard)}
                socket={socket}
                roomId={chatRoomId}
                friendId={friendId}
                groupId={groupId}
                channelId={channelId}
            />
        </ChatContainer>
    );
};

export default Chat;