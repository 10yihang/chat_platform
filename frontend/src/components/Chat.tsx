import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, TextField, Button, Paper, IconButton, Typography, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { styled } from '@mui/material/styles';
import UserProfileDialog from './UserProfileDialog';
import MessageBubble from './MessageBubble';
import { Message, ChatProps } from '../types';
import SocketProvider, { useSocketContext } from '../contexts/SocketContextProvider';
import { ChatContainer, MessagesContainer, InputContainer } from '../styles';
import { message } from 'antd';
import { Socket } from 'socket.io-client';

const Chat: React.FC<ChatProps> = ({ channelId, groupId, friendId, userName, avatar }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<null | HTMLInputElement>(null);
    const roomId = channelId === 'public' ? 'group_1' : `group_${groupId}` || `friend_${friendId}`;
    const { socket, isConnected } = useSocketContext();
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const messageShownRef = useRef(false);


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
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        channelId: channelId,
                        groupId: groupId,
                        friendId: friendId
                    })
                });
                const data = await response.json();
                setMessages(data);
            } catch (error) {
                console.error('获取历史消息失败:', error);
            }
        };

        loadHistory();
    }, [channelId, groupId, friendId]); // 添加依赖项，确保切换聊天时重新加载

    useEffect(() => {
        if (socket) {
            socket.on('message', (message: Message) => {
                setMessages(prev => [...prev, message]);
            });
            socket.on('file_uploaded', (message: Message) => {
                setMessages(prev => [...prev, message]);
            });
        }

        return () => {
            socket?.off('message');
        };
    }, [socket, isConnected, channelId, groupId, friendId]);

    // useEffect(() => {
    //     if (socket && isConnected) {
    //         const handleMessage = (newMsg: Message) => {
    //             setMessages(prev => {
    //                 const exists = prev.some(msg => msg.id === newMsg.id);
    //                 if (exists) return prev;
    //                 const newMessages = [...prev, newMsg];
    //                 setTimeout(scrollToBottom, 100);
    //                 return newMessages;
    //             });
    //         };

    //         socket.on('message', handleMessage);
    //         socket.on('file_uploaded', handleMessage);
    //         socket.on('error', (error: any) => {
    //             console.error('Socket错误:', error);
    //             message.error('发送失败：' + error.msg);
    //         });

    //         return () => {
    //             socket.off('message');
    //             socket.off('file_uploaded');
    //             socket.off('error');
    //         };
    //     }
    // }, [socket, isConnected, scrollToBottom]);

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
        
        if ((!localStorage.getItem('userId') || localStorage.getItem('userId') === 'undefined') 
            && localStorage.getItem('IsGuest') !== 'true') {
            alert('请先登录');
            return;
        }
    
        if (file.size > 20 * 1024 * 1024) {
            alert('文件大小不能超过20MB');
            return;
        }
    
        const reader = new FileReader();
        reader.onload = async (e) => {
            if (!e.target?.result) return;
    
            const messageData = {
                sender_id: parseInt(localStorage.getItem('userId') || '0'),
                receiver_id: friendId ? parseInt(friendId) : 0,
                group_id: groupId ? parseInt(groupId) : channelId === 'public' ? 1 : 0,
                content: file.name,
                type: 'file',
                sender_name: userName,
                room: roomId
            };
    
            try {
                const fileData = e.target.result;
                socket?.emit('chat', { 
                    message: messageData, 
                    room: roomId,
                    file: {
                        name: file.name,
                        type: file.type,
                        data: Array.from(new Uint8Array(fileData as ArrayBuffer))
                    }
                });
            } catch (error) {
                console.error('发送文件失败:', error);
            }
        };
        reader.readAsArrayBuffer(file);
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