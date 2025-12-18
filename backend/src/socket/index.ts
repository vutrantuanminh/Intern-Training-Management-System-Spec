import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';

interface AuthenticatedSocket extends Socket {
    userId: number;
    userName: string;
    userRoles: string[];
}

let io: Server;

export const initializeSocket = (httpServer: HttpServer): Server => {
    io = new Server(httpServer, {
        cors: {
            origin: env.frontendUrl,
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    io.use(async (socket: Socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const payload = verifyAccessToken(token);
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                include: {
                    roles: {
                        include: { role: true },
                    },
                },
            });

            if (!user || !user.isActive) {
                return next(new Error('Invalid user'));
            }

            const authSocket = socket as AuthenticatedSocket;
            authSocket.userId = user.id;
            authSocket.userName = user.fullName;
            authSocket.userRoles = user.roles.map(ur => ur.role.name);

            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const authSocket = socket as AuthenticatedSocket;
        console.log(`✅ User connected: ${authSocket.userName} (${authSocket.userId})`);

        // Join user's personal room for notifications
        socket.join(`user:${authSocket.userId}`);

        // Emit online status
        io.emit('user_online', {
            userId: authSocket.userId,
            userName: authSocket.userName,
        });

        // Chat room events
        socket.on('join_room', async (roomId: number) => {
            // Verify membership
            const isMember = await prisma.chatRoomMember.findUnique({
                where: {
                    roomId_userId: { roomId, userId: authSocket.userId },
                },
            });

            if (isMember) {
                socket.join(`room:${roomId}`);
                console.log(`User ${authSocket.userId} joined room ${roomId}`);
            }
        });

        socket.on('leave_room', (roomId: number) => {
            socket.leave(`room:${roomId}`);
            console.log(`User ${authSocket.userId} left room ${roomId}`);
        });

        socket.on('send_message', async (data: { roomId: number; content: string }) => {
            const { roomId, content } = data;

            // Verify membership
            const isMember = await prisma.chatRoomMember.findUnique({
                where: {
                    roomId_userId: { roomId, userId: authSocket.userId },
                },
            });

            if (!isMember) return;

            // Save message
            const message = await prisma.chatMessage.create({
                data: {
                    roomId,
                    senderId: authSocket.userId,
                    content,
                },
                include: {
                    sender: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                },
            });

            // Update room timestamp
            await prisma.chatRoom.update({
                where: { id: roomId },
                data: { updatedAt: new Date() },
            });

            // Emit to room
            io.to(`room:${roomId}`).emit('new_message', message);

            // Confirm to sender
            socket.emit('message_sent', message);
        });

        socket.on('typing', (data: { roomId: number }) => {
            socket.to(`room:${data.roomId}`).emit('user_typing', {
                userId: authSocket.userId,
                userName: authSocket.userName,
            });
        });

        socket.on('stop_typing', (data: { roomId: number }) => {
            socket.to(`room:${data.roomId}`).emit('user_stop_typing', {
                userId: authSocket.userId,
            });
        });

        // Online status
        socket.on('online', () => {
            io.emit('user_online', {
                userId: authSocket.userId,
                userName: authSocket.userName,
            });
        });

        socket.on('disconnect', () => {
            console.log(`👋 User disconnected: ${authSocket.userName} (${authSocket.userId})`);
            io.emit('user_offline', { userId: authSocket.userId });
        });
    });

    console.log('✅ Socket.io initialized');
    return io;
};

// Send notification to specific user
export const sendNotification = (userId: number, notification: {
    id: number;
    type: string;
    title: string;
    message: string;
    linkTo?: string;
}): void => {
    if (io) {
        io.to(`user:${userId}`).emit('notification', notification);
    }
};

// Send to all users in a room
export const sendToRoom = (roomId: number, event: string, data: unknown): void => {
    if (io) {
        io.to(`room:${roomId}`).emit(event, data);
    }
};

// Get io instance
export const getIO = (): Server | undefined => io;
