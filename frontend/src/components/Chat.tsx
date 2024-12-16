import React, { useEffect, useState } from 'react';

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');

    useEffect(() => {
        // 这里可以添加代码来获取历史消息
    }, []);

    const sendMessage = () => {
        if (newMessage.trim()) {
            setMessages([...messages, newMessage]);
            setNewMessage('');
            // 这里可以添加代码来发送消息到后端
        }
    };

    return (
        <div>
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index} className="message">
                        {msg}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="输入消息..."
            />
            <button onClick={sendMessage}>发送</button>
        </div>
    );
};

export default Chat;