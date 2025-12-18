import { io, Socket } from 'socket.io-client';
import { config, auth } from '../config/api';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        const token = auth.getToken();

        if (!token) {
            console.error('No token available for socket connection');
            return;
        }

        this.socket = io(config.socketUrl, {
            auth: { token },
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('👋 Socket disconnected');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }

    // Notification events
    onNotification(callback: (notification: any) => void) {
        this.socket?.on('notification', callback);
    }

    // Chat events
    onNewMessage(callback: (message: any) => void) {
        this.socket?.on('new_message', callback);
    }

    sendMessage(roomId: number, content: string) {
        this.socket?.emit('send_message', { roomId, content });
    }

    onMessageSent(callback: (message: any) => void) {
        this.socket?.on('message_sent', callback);
    }

    // Typing indicators
    typing(roomId: number) {
        this.socket?.emit('typing', { roomId });
    }

    stopTyping(roomId: number) {
        this.socket?.emit('stop_typing', { roomId });
    }

    onUserTyping(callback: (data: { userId: number; userName: string }) => void) {
        this.socket?.on('user_typing', callback);
    }

    onUserStopTyping(callback: (data: { userId: number }) => void) {
        this.socket?.on('user_stop_typing', callback);
    }

    // Room management
    joinRoom(roomId: number) {
        this.socket?.emit('join_room', roomId);
    }

    leaveRoom(roomId: number) {
        this.socket?.emit('leave_room', roomId);
    }

    // Online status
    setOnline() {
        this.socket?.emit('online');
    }

    onUserOnline(callback: (data: { userId: number; userName: string }) => void) {
        this.socket?.on('user_online', callback);
    }
}

export const socketService = new SocketService();
