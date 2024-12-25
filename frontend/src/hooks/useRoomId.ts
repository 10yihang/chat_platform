import { useMemo } from 'react';

export const useRoomId = (channelId?: string, groupId?: string, friendId?: string) => {
    const chatRoomId = useMemo(() => {
        if (channelId === 'public') return 'group_1';
        if (groupId) return `group_${groupId}`;
        if (friendId) return [`user_${friendId}`, `user_${localStorage.getItem('userId')}`];
        return '';
    }, [channelId, groupId, friendId]);

    const whiteBoardRoomId = useMemo(() => {
        if (channelId === 'public') return 'group_1';
        if (groupId) return `group_${groupId}`;
        if (friendId) {
            const users = [friendId, localStorage.getItem('userId')].sort();
            return `user${users[0]}_user${users[1]}`;
        }
        return '';
    }, [channelId, groupId, friendId]);

    return { chatRoomId, whiteBoardRoomId };
};
