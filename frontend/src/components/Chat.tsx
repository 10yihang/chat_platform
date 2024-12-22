import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Paper, IconButton, Typography, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { styled } from '@mui/material/styles';
import { useSocket } from '../hooks/useSocket';

interface Message {
    id: number;
    sender_id: number;
    sender_name?: string; 
    receiver_id: number;
    group_id: number;
    content: string;
    type: 'text' | 'emoji' | 'file';
    created_at: string;
    status: string;
    file_url?: string;
}

interface ChatProps {
    channelId?: string;
    groupId?: string;
    friendId?: string;
    userName?: string;
    avatar?: string;
}

const ChatContainer = styled(Box)({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#f0f2f5',
    position: 'relative'
});

const MessagesContainer = styled(Box)({
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%'
});

const InputContainer = styled(Box)({
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 20px',
    backgroundColor: '#fff',
    borderTop: '1px solid rgba(0, 0, 0, 0.12)',
    zIndex: 1000,
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%'
});

const MessageWrapper = styled(Box)<{ isOwn: boolean }>(({ isOwn }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px',
    flexDirection: isOwn ? 'row-reverse' : 'row',
    gap: '8px',
    width: '100%',
    padding: '0 20px'
}));



const MessageBubble = styled(Paper)<{ isOwn: boolean }>(({ isOwn, theme }) => ({
    padding: theme.spacing(1.5),
    borderRadius: '12px',
    minWidth: '120px',
    width: 'fit-content',  // 根据内容自适应宽度
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    backgroundColor: isOwn ? '#dcf8c6' : '#fff',
    boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
}));

const MessageTime = styled(Typography)({
    fontSize: '0.75rem',
    color: '#667781',
    marginTop: '4px',
    textAlign: 'right'
});

const UserAvatar = styled(Avatar)({
    width: 40,
    height: 40
});

const UserName = styled(Typography)({
    fontSize: '0.8rem',
    color: '#667781',
    marginBottom: '4px'
});

const MessageContent = styled(Typography)({
    fontSize: '0.9rem',
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    flex: '0 1 auto'
});

const Chat: React.FC<ChatProps> = ({ channelId, groupId, friendId, userName, avatar }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<null | HTMLInputElement>(null);
    const socket = useSocket(global.socketUrl);
    const roomId = channelId === 'public' ? 'group_1' : `group_${groupId}` || `friend_${friendId}`;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // useEffect(() => {
    //     fetchMessages();
    //     const interval = setInterval(fetchMessages, 3000);
    //     return () => clearInterval(interval);
    // }, []);

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
                    // 检查消息是否已存在
                    const exists = prev.some(msg => msg.id === newMsg.id);
                    if (exists) {
                        return prev;
                    }
                    return [...prev, newMsg];
                });
                scrollToBottom();
            });

            socket.on('error', (error: any) => {
                console.error('Socket错误:', error);
            });

            return () => {
                socket.off('message');
                socket.off('error');
            };
        }
    }, [socket]);

    // const fetchMessages = async () => {
    //     // try {
    //     //   const userId = localStorage.getItem('userId');
    //     //   const response = await fetch(`${global.preUrl}/api/chat/receive/${userId}`);
    //     //   const data = await response.json();
    //     //   setMessages(data);
    //     // } catch (error) {
    //     //   console.error('获取消息失败:', error);
    //     // }
    // };

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        console.log(localStorage.getItem('userId'));

        if (!localStorage.getItem('userId') || localStorage.getItem('userId') === 'undefined') {
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
                {messages.map((message, index) => {
                    const isOwn = message.sender_id.toString() === localStorage.getItem('userId');
                    return (
                        <MessageWrapper key={`${message.id}_${index}`} isOwn={isOwn}>
                            <UserAvatar src={avatar} />
                            <MessageContent>
                                {!isOwn && (
                                    <UserName>
                                        {message.sender_name || '用户'}
                                    </UserName>
                                )}
                                <MessageBubble isOwn={isOwn}>
                                    <MessageContent>
                                        {message.content}
                                    </MessageContent>
                                    <MessageTime>
                                        {new Date(message.created_at).toLocaleTimeString()}
                                    </MessageTime>
                                </MessageBubble>
                            </MessageContent>
                        </MessageWrapper>
                    );
                })}
                <div ref={messagesEndRef} />
            </MessagesContainer>

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