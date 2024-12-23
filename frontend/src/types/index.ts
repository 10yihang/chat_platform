import { Socket } from 'socket.io-client';

export interface Message {
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

export interface ChatProps {
    channelId?: string;
    groupId?: string;
    friendId?: string;
    userName?: string;
    avatar?: string;
}

export interface ChatWindowProps {
    channelId: string;
    chatName?: string;
    groupId?: string;
    friendId?: string;
    userName?: string;
    avatar?: string;
}

export interface ChatListProps {
    socket?: Socket;
}

export interface LayoutProps {
    children: React.ReactNode;
    socket: Socket;
    onLogout?: () => void;
};

export interface MediaPlayerProps {
    src: string;
    type: 'audio' | 'video';
}

export interface NavigationProps {
    onLogout: () => void;
    socket?: Socket;
}

export interface FriendRequestData {
    request_id: number;
    sender: {
        id: number;
        username: string;
        avatar?: string;
    };
}

export interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  socket?: Socket;
}