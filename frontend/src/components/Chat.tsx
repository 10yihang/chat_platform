import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

const Chat: React.FC<ChatProps> = ({ channelId, groupId, friendId, avatar }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<null | HTMLInputElement>(null);
    const { socket, isConnected } = useSocketContext();
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const messageShownRef = useRef(false);

    const roomId = useMemo(() => {
        if (channelId === 'public') return 'group_1';
        if (groupId) return `group_${groupId}`;
        if (friendId) return [`user_${friendId}`, `user_${localStorage.getItem('userId')}`];
        return '';
    }, [channelId, groupId, friendId]);

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
        if (socket && roomId) {
            // 监听特定房间的消息
            socket.on('message', (message: Message) => {
                if (message.group_id === (groupId ? parseInt(groupId) : channelId === 'public' ? 1 : 0) ||
                    (message.receiver_id === parseInt(localStorage.getItem('userId') || '0') && 
                     message.sender_id === (friendId ? parseInt(friendId) : 0)) ||
                    (message.sender_id === parseInt(localStorage.getItem('userId') || '0') && 
                     message.receiver_id === (friendId ? parseInt(friendId) : 0))) {
                    setMessages(prev => [...prev, message]);
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('message');
            }
        };
    }, [socket, roomId, groupId, friendId, channelId]);

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
            sender_name: localStorage.getItem('userName') || '',
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

        const CHUNK_SIZE = 100 * 1024; // 100KB
        
        if (file.size > 20 * 1024 * 1024) {
            message.error('文件大小不能超过20MB');
            return;
        }
    
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        
        // 创建文件消息
        const messageData = {
            sender_id: parseInt(localStorage.getItem('userId') || '0'),
            receiver_id: friendId ? parseInt(friendId) : 0,
            group_id: groupId ? parseInt(groupId) : channelId === 'public' ? 1 : 0,
            content: file.name,
            type: 'file',
            sender_name: localStorage.getItem('userName') || '',
            room: roomId
        };
        console.log('文件消息:', messageData);
    
        try {
            // 开始传输通知
            const fileId = await new Promise<string>((resolve, reject) => {
                socket?.emit('file_transfer_start', {
                    fileName: file.name,
                    fileSize: file.size,
                    totalChunks,
                    fileType: file.type,
                    message: messageData
                });
    
                socket?.once('file_transfer_init', (response) => {
                    console.log('收到文件ID:', response.file_id);
                    resolve(response.file_id);
                });
    
                setTimeout(() => reject(new Error('File transfer init timeout')), 5000);
            });
    
            console.log('开始发送文件分片, fileId:', fileId);
    
            // 分片读取并发送
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = await file.slice(start, end).arrayBuffer();
                
                console.log(`发送第 ${i + 1}/${totalChunks} 个分片`);
    
                socket?.emit('file_chunk', {
                    fileId: fileId,  // 修改这里的键名
                    chunkIndex: i,
                    totalChunks,
                    data: Array.from(new Uint8Array(chunk))
                });
    
                // 等待服务器确认
                await new Promise<void>((resolve, reject) => {
                    socket?.once('chunk_received', (response) => {
                        console.log(`分片 ${i + 1} 已确认`);
                        resolve();
                    });
    
                    setTimeout(() => reject(new Error('Chunk upload timeout')), 5000);
                });
            }
        } catch (error) {
            console.error('文件上传失败:', error);
            message.error('文件上传失败，请重试');
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