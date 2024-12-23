
export interface Message {
    id: number;
    sender_id: number;
    sender_name?: string;
    receiver_id: number;
    group_id: number;
    content: string;
    type: 'text' | 'emoji' | 'file' | 'voice';
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
    channelId?: string;
    chatName?: string;
    groupId?: string;
    friendId?: string;
    userName?: string;
    avatar?: string;
}

export interface LayoutProps {
    children: React.ReactNode;
    onLogout?: () => void;
};

export interface MediaPlayerProps {
    src: string;
    type: 'audio' | 'video';
}

export interface NavigationProps {
    onLogout: () => void;
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
}

export interface ChatItem {
    id: number;
    name: string;
    avatar?: string;
    type: 'group' | 'friend';
  }