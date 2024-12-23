import React from 'react';
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../hooks/useSocket';

const PublicChannel: React.FC = () => {

  return <ChatWindow channelId="public"/>;
};

export default PublicChannel;