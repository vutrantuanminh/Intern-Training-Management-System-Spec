import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { socketService } from '../services/socketService';

export function useChat(roomId: number) {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [typing, setTyping] = useState<{ userId: number; userName: string } | null>(null);

    useEffect(() => {
        loadMessages();

        // Join room
        socketService.joinRoom(roomId);

        // Listen for new messages
        socketService.onNewMessage((message) => {
            if (message.chatRoomId === roomId) {
                setMessages((prev) => [...prev, message]);
            }
        });

        // Listen for typing
        socketService.onUserTyping((data) => {
            setTyping(data);
            setTimeout(() => setTyping(null), 3000);
        });

        socketService.onUserStopTyping(() => {
            setTyping(null);
        });

        return () => {
            socketService.leaveRoom(roomId);
        };
    }, [roomId]);

    const loadMessages = async () => {
        try {
            const { data } = await chatService.getRoomMessages(roomId);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = useCallback((content: string) => {
        socketService.sendMessage(roomId, content);
    }, [roomId]);

    const startTyping = useCallback(() => {
        socketService.typing(roomId);
    }, [roomId]);

    const stopTyping = useCallback(() => {
        socketService.stopTyping(roomId);
    }, [roomId]);

    return {
        messages,
        loading,
        typing,
        sendMessage,
        startTyping,
        stopTyping,
        refresh: loadMessages,
    };
}
