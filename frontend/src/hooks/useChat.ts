import { useState, useEffect } from 'react';
import { Message } from '../types';
import { Socket } from 'socket.io-client';

export const useChat = (socket: Socket | null, roomId: string | string[], channelId?: string, groupId?: string, friendId?: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [avator, setAvator] = useState<string[]>(['']);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await fetch(`${global.preUrl}/api/chat/history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ channelId, groupId, friendId })
                });
                const data = await response.json();
                setMessages(data);
            } catch (error) {
                console.error('获取历史消息失败:', error);
            }
        };

        loadHistory();
    }, [channelId, groupId, friendId]);

    useEffect(() => {
        if (!socket || !roomId) return;

        const handleMessage = (message: Message) => {
            if (
                message.group_id === (groupId ? parseInt(groupId) : channelId === 'public' ? 1 : 0) ||
                (message.receiver_id === parseInt(localStorage.getItem('userId') || '0') &&
                    message.sender_id === (friendId ? parseInt(friendId) : 0)) ||
                (message.sender_id === parseInt(localStorage.getItem('userId') || '0') &&
                    message.receiver_id === (friendId ? parseInt(friendId) : 0))
            ) {
                setMessages(prev => [...prev, message]);
            }
        };

        socket.on('message', handleMessage);
        return () => {
            socket.off('message', handleMessage);
        };
    }, [socket, roomId, groupId, friendId, channelId]);

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        if ((!localStorage.getItem('userId') || localStorage.getItem('userId') === 'undefined') && 
            localStorage.getItem('IsGuest') !== 'true') {
            throw new Error('请先登录');
        }

        const messageData = {
            sender_id: parseInt(localStorage.getItem('userId') || '0'),
            receiver_id: friendId ? parseInt(friendId) : 0,
            group_id: groupId ? parseInt(groupId) : channelId === 'public' ? 1 : 0,
            content,
            type: 'text',
            sender_name: localStorage.getItem('userName') || '',
            room: roomId
        };

        socket?.emit('chat', { message: messageData, room: roomId });
    };

    return { messages, sendMessage, avator};
};
