import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { Message } from '../../types';
import MessageBubble from '../MessageBubble';
import { MessagesContainer } from '../../styles';

interface MessageListProps {
    messages: Message[];
    onAvatarClick: (userId: number) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, onAvatarClick }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // console.log(messages);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            if (isNearBottom) {
                scrollToBottom();
            }
        }
    }, [messages]);

    return (
        <MessagesContainer
            ref={containerRef}
            style={{ transition: 'opacity 0.5s ease-in-out', opacity: 1 }}
        >
            <Box sx={{ flexGrow: 1, minHeight: 'min-content' }}>
                {messages.map((message, index) => (
                    <MessageBubble
                        key={`${message.id}_${index}`}
                        message={message}
                        isown={message.sender_id.toString() === localStorage.getItem('userId')}
                        avatar={`${global.preUrl}/api/file/avatar/avatar_${message.sender_id}.jpg`}
                        onAvatarClick={() => onAvatarClick(message.sender_id)}
                    />
                ))}
            </Box>
            <div ref={messagesEndRef} style={{ height: 1 }} />
        </MessagesContainer>
    );
};

export default MessageList;