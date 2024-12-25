import React, { useRef, useEffect } from 'react';
import { Message } from '../../types';
import MessageBubble from '../MessageBubble';
import { MessagesContainer } from '../../styles';

interface MessageListProps {
    messages: Message[];
    avatar?: string;
    onAvatarClick: (userId: number) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, avatar, onAvatarClick }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <MessagesContainer>
            {messages.map((message, index) => (
                <MessageBubble
                    key={`${message.id}_${index}`}
                    message={message}
                    isown={message.sender_id.toString() === localStorage.getItem('userId')}
                    avatar={avatar}
                    onAvatarClick={() => onAvatarClick(message.sender_id)}
                />
            ))}
            <div ref={messagesEndRef} style={{ height: 0 }} />
        </MessagesContainer>
    );
};

export default MessageList;