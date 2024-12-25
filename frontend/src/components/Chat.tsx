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

const Chat: React.FC<ChatProps> = ({ channelId, groupId, friendId, avatar }) => {
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const { socket } = useSocketContext();
    const { chatRoomId, whiteBoardRoomId } = useRoomId(channelId, groupId, friendId);
    const { messages, sendMessage } = useChat(socket, chatRoomId, channelId, groupId, friendId);
    console.log('messages:', messages);
    const [aiSuggestion, setAiSuggestion] = useState<string>('');
    const [aiLoading, setAiLoading] = useState(false);
    const abortControllerRef = React.useRef<AbortController | null>(null);
    const [showAiSuggestion, setShowAiSuggestion] = useState(false);

    const getAISuggestion = async (messages: Message[]) => {
        if (!messages.length) return;

        const lastMessage = messages[messages.length - 1];
        // 移除下方条件以允许随时请求AI建议
        // if (lastMessage.sender_id.toString() === localStorage.getItem('userId')) return;

        setAiLoading(true);
        setAiSuggestion('');

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(`${global.preUrl}/api/ai/suggest/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    messages: messages.slice(-5),
                    current_user_id: localStorage.getItem('userId')
                }),
                signal: abortControllerRef.current.signal
            });

            const reader = response.body?.getReader();
            if (!reader) return;

            const decoder = new TextDecoder();
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.content) {
                                setAiSuggestion(prev => prev + data.content);
                            }
                        } catch (e) {
                            console.error('解析数据失败:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('获取AI建议失败:', error);
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        if (messages.length > 0) {
            getAISuggestion(messages);
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [messages]);

    const handleSendMessage = async (content: string) => {
        try {
            await sendMessage(content);
            setAiSuggestion('');
        } catch (error) {
            message.error((error as Error).message);
        }
    };

    const handleAvatarClick = (userId: number) => {
        setSelectedUserId(userId);
        setProfileDialogOpen(true);
    };

    const handleRequestAiSuggestion = () => {
        setShowAiSuggestion((prev) => {
            const newState = !prev;
            if (!prev && messages.length > 0) {
                getAISuggestion(messages);
            } else if (!prev) {
                message.info('需要一些聊天记录才能生成建议');
            }
            return newState;
        });
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
                    suggestion={aiSuggestion}
                    loading={aiLoading}
                    onSend={handleSendMessage}
                    onCancel={() => {
                        if (abortControllerRef.current) {
                            abortControllerRef.current.abort();
                        }
                        setAiSuggestion('');
                        setAiLoading(false);
                        setShowAiSuggestion(false);
                    }}
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
            />
        </ChatContainer>
    );
};

export default Chat;