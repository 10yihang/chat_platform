import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, TextField, Button, Paper, IconButton, Typography, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { styled } from '@mui/material/styles';
import UserProfileDialog from './UserProfileDialog';
import MessageBubble from './MessageBubble';
import { Message, ChatProps } from '../types';
import {ChatContainer, MessagesContainer, InputContainer} from '../styles';

const Chat: React.FC<ChatProps> = ({ channelId, groupId, friendId, userName, avatar }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<null | HTMLInputElement>(null);
    const roomId = channelId === 'public' ? 'group_1' : `group_${groupId}` || `friend_${friendId}`;

    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);

    const handleAvatarClick = (userId: number) => {
        setSelectedUserId(userId);
        setProfileDialogOpen(true);
    };

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await fetch(`${global.preUrl}/api/chat/history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: localStorage.getItem('userId'),
                        groupId: groupId || (channelId === 'public' ? 1 : null),
                        friendId: friendId
                    })
                });

                const data = await response.json();
                console.log(data)
                // 使用Set去重
                const uniqueMessages = Array.from(
                    new Map(data.map((item: Message) => [item.id, item])).values()
                );
                setMessages((uniqueMessages as Message[])); // 反转消息顺序以显示最新消息在底部
            } catch (error) {
                console.error('获取历史消息失败:', error);
            }
        };

        loadHistory();

        if (socket) {
            socket.on('message', (message: Message) => {
                setMessages(prev => [...prev, message]);
            });
        }

        return () => {
            socket?.off('message');
        };
    }, [socket, channelId, groupId, friendId]);

    useEffect(() => {
        if (socket) {
            socket.on('message', (newMsg: Message) => {
                console.log('收到新消息:', newMsg);
                setMessages(prev => {
                    const exists = prev.some(msg => msg.id === newMsg.id);
                    if (exists) {
                        return prev;
                    }
                    const newMessages = [...prev, newMsg];
                    // 使用 setTimeout 确保 DOM 已更新
                    setTimeout(scrollToBottom, 100);
                    return newMessages;
                });
            });

            socket.on('error', (error: any) => {
                console.error('Socket错误:', error);
            });

            return () => {
                socket.off('message');
                socket.off('error');
            };
        }
    }, [socket, scrollToBottom]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        if ((!localStorage.getItem('userId') || localStorage.getItem('userId') === 'undefined') && localStorage.getItem('IsGuest') !== 'true') {
            alert('请先登录');
            return;
        }

        const messageData = {
            sender_id: parseInt(localStorage.getItem('userId') || '0'),
            receiver_id: friendId ? parseInt(friendId) : 0,
            group_id: groupId ? parseInt(groupId) : channelId === 'public' ? 1 : 0,
            content: newMessage,
            type: 'text',
            sender_name: userName,
            room: roomId
        };

        try {
            socket?.emit('chat', { message: messageData, room: roomId });
            setNewMessage('');
        } catch (error) {
            console.error('发送消息失败:', error);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadResponse = await fetch(`${global.preUrl}/api/media/upload`, {
                method: 'POST',
                body: formData,
            });

            if (uploadResponse.ok) {
                const { file_url } = await uploadResponse.json();
                await fetch(`${global.preUrl}/api/chat/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sender_id: localStorage.getItem('userId'),
                        receiver_id: 0,
                        group_id: 1,
                        content: file.name,
                        type: 'file',
                        file_url,
                        status: 'sent'
                    }),
                });
                // await fetchMessages();
            }
        } catch (error) {
            console.error('上传文件失败:', error);
        }
    };

    return (
        <ChatContainer>
            <MessagesContainer>
                {messages.map((message, index) => (
                    <MessageBubble
                        key={`${message.id}_${index}`}
                        message={message}
                        isown={message.sender_id.toString() === localStorage.getItem('userId')}
                        avatar={avatar}
                        onAvatarClick={() => handleAvatarClick(message.sender_id)}
                    />
                ))}
                <div ref={messagesEndRef} style={{ height: 0 }} /> {/* 添加高度为0的占位元素 */}
            </MessagesContainer>

            <UserProfileDialog
                open={profileDialogOpen}
                onClose={() => setProfileDialogOpen(false)}
                userId={selectedUserId || 0}
                socket={socket}
            />

            <InputContainer>
                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />
                    <IconButton onClick={() => fileInputRef.current?.click()}>
                        <AttachFileIcon />
                    </IconButton>
                    <TextField
                        fullWidth
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }
                        }
                        placeholder="输入消息..."
                        multiline
                        maxRows={4}
                        size="small"
                    />
                    <IconButton onClick={handleSend} color="primary">
                        <SendIcon />
                    </IconButton>
                </Box>
            </InputContainer>
        </ChatContainer>
    );
};

export default Chat;