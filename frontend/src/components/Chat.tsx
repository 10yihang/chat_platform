import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, TextField, Button, Paper, IconButton, Typography, Avatar, LinearProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { styled } from '@mui/material/styles';
import UserProfileDialog from './UserProfileDialog';
import MessageBubble from './MessageBubble';
import VoiceCall from './VoiceCall';
import VideoCall from './VideoCall';
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

    const CHUNK_SIZE = 200 * 1024; // 200KB
    const MAX_CONCURRENT_UPLOADS = 5;
    const TIMEOUT_DURATION = 5000;
    const MAX_RETRIES = 3;

    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

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
    }, [channelId, groupId, friendId, avatar]); // 添加依赖项，确保切换聊天时重新加载

    useEffect(() => {
        if (socket && roomId) {
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


    const uploadChunk = async (
        socket: any, 
        fileId: string, 
        chunkIndex: number, 
        chunk: ArrayBuffer, 
        totalChunks: number,
        retryCount = 0
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            const chunkHandler = () => {
                resolve();
            };

            socket?.once('chunk_received', chunkHandler);
            socket?.emit('file_chunk', {
                fileId,
                chunkIndex,
                totalChunks,
                data: Array.from(new Uint8Array(chunk))
            });

            const timeoutId = setTimeout(async () => {
                socket?.off('chunk_received', chunkHandler);
                if (retryCount < MAX_RETRIES) {
                    console.log(`重试上传分片 ${chunkIndex}, 第 ${retryCount + 1} 次`);
                    try {
                        await uploadChunk(socket, fileId, chunkIndex, chunk, totalChunks, retryCount + 1);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error(`分片 ${chunkIndex} 上传超时，已重试 ${MAX_RETRIES} 次`));
                }
            }, TIMEOUT_DURATION);

            socket?.once('chunk_received', () => {
                clearTimeout(timeoutId);
                socket?.off('chunk_received', chunkHandler);
                resolve();
            });
        });
    };

    const uploadChunksConcurrently = async (chunks: ArrayBuffer[], fileId: string, totalChunks: number) => {
        let completedChunks = 0;
        const updateProgress = () => {
            completedChunks++;
            const progress = (completedChunks / totalChunks) * 100;
            setUploadProgress(progress);
        };

        for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
            const uploadPromises = [];
            for (let j = 0; j < MAX_CONCURRENT_UPLOADS && i + j < chunks.length; j++) {
                const chunkIndex = i + j;
                uploadPromises.push(
                    uploadChunk(socket, fileId, chunkIndex, chunks[chunkIndex], totalChunks)
                        .then(() => {
                            updateProgress();
                        })
                );
            }
            await Promise.all(uploadPromises).catch((error) => {
                console.error('分片上传失败:', error);
                throw error;
            });
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        event.target.value = '';

        if (file.size > 1024 * 1024 * 1024) {
            message.error('文件大小不能超过1GB');
            return;
        }
        
        const filename_nospace = file.name.replace(/\s/g, '_');
        console.log('文件名:', filename_nospace);

        const fileName = encodeURIComponent(filename_nospace);
        
        const messageData = {
            sender_id: parseInt(localStorage.getItem('userId') || '0'),
            receiver_id: friendId ? parseInt(friendId) : 0,
            group_id: groupId ? parseInt(groupId) : channelId === 'public' ? 1 : 0,
            content: filename_nospace, 
            type: 'file',
            sender_name: localStorage.getItem('userName') || '',
            room: roomId
        };

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const chunks: ArrayBuffer[] = [];

            // 预先切分所有分片
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                chunks.push(await file.slice(start, end).arrayBuffer());
            }

            // 文件上传初始化
            const fileId = await new Promise<string>((resolve, reject) => {
                const initHandler = (response: any) => {
                    console.log('收到文件ID:', response.file_id);
                    resolve(response.file_id);
                };

                socket?.once('file_transfer_init', initHandler);

                socket?.emit('file_transfer_start', {
                    fileName: fileName,
                    fileSize: file.size,
                    totalChunks,
                    fileType: file.type,
                    message: messageData
                });

                const timeout = setTimeout(() => {
                    socket?.off('file_transfer_init', initHandler);
                    reject(new Error('File transfer init timeout'));
                }, 5000);
            });

            // 并行上传分片
            await uploadChunksConcurrently(chunks, fileId, totalChunks);
            message.success('文件上传成功,请稍等');
        } catch (error) {
            console.error('文件上传失败:', error);
            message.error('文件上传失败');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
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
                    <Box sx={{ width: '100%' }}>
                        {isUploading && (
                            <LinearProgress 
                                variant="determinate" 
                                value={uploadProgress} 
                                sx={{ mb: 1 }}
                            />
                        )}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                            <IconButton onClick={() => fileInputRef.current?.click()}>
                                <AttachFileIcon />
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
                    </Box>
                </InputContainer>
            </ChatContainer>
    );
};

export default Chat;