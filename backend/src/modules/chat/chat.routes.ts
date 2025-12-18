import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateBody, validateQuery, validateParams, idParamSchema } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { createRoomSchema, sendMessageSchema, paginationSchema } from '../../utils/validators.js';
import { z } from 'zod';

const router = Router();

// GET /api/chat/users - Get users available for chat (all authenticated users can access)
router.get(
    '/users',
    authenticate,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const search = req.query.search as string | undefined;

            const users = await prisma.user.findMany({
                where: {
                    id: { not: userId },
                    isActive: true,
                    ...(search && {
                        OR: [
                            { fullName: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                        ],
                    }),
                },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatar: true,
                    roles: {
                        select: {
                            role: { select: { name: true } },
                        },
                    },
                },
                take: 50,
                orderBy: { fullName: 'asc' },
            });

            const formattedUsers = users.map(u => ({
                id: u.id,
                fullName: u.fullName,
                email: u.email,
                avatar: u.avatar,
                role: u.roles[0]?.role.name || 'USER',
            }));

            successResponse(res, formattedUsers);
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/chat/rooms - Get user's chat rooms
router.get(
    '/rooms',
    authenticate,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;

            const rooms = await prisma.chatRoom.findMany({
                where: {
                    members: {
                        some: { userId },
                    },
                },
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, fullName: true, email: true, avatar: true },
                            },
                        },
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: {
                            sender: {
                                select: { id: true, fullName: true },
                            },
                        },
                    },
                    course: {
                        select: { id: true, title: true },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });

            const formattedRooms = rooms.map(room => ({
                id: room.id,
                name: room.name || (room.isGroup
                    ? null
                    : room.members.find(m => m.userId !== userId)?.user.fullName),
                isGroup: room.isGroup,
                course: room.course,
                members: room.members.map(m => m.user),
                lastMessage: room.messages[0] || null,
                unreadCount: 0, // TODO: implement unread tracking
            }));

            successResponse(res, formattedRooms);
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/chat/rooms - Create chat room
router.post(
    '/rooms',
    authenticate,
    validateBody(createRoomSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name, participantIds, isGroup } = req.body;
            const userId = req.user!.id;

            // Add creator to participants
            const allParticipants = [...new Set([userId, ...participantIds])];

            // For private chat, check if room already exists
            if (!isGroup && allParticipants.length === 2) {
                const existingRoom = await prisma.chatRoom.findFirst({
                    where: {
                        isGroup: false,
                        members: {
                            every: {
                                userId: { in: allParticipants },
                            },
                        },
                    },
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: { id: true, fullName: true, email: true, avatar: true },
                                },
                            },
                        },
                    },
                });

                if (existingRoom) {
                    successResponse(res, {
                        ...existingRoom,
                        members: existingRoom.members.map(m => m.user),
                    });
                    return;
                }
            }

            // Create new room
            const room = await prisma.chatRoom.create({
                data: {
                    name: isGroup ? name : null,
                    isGroup: isGroup || false,
                    members: {
                        create: allParticipants.map(pId => ({
                            userId: pId,
                        })),
                    },
                },
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, fullName: true, email: true, avatar: true },
                            },
                        },
                    },
                },
            });

            successResponse(res, {
                ...room,
                members: room.members.map(m => m.user),
            }, 'Chat room created successfully', 201);
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/chat/rooms/:id/messages - Get room messages
router.get(
    '/rooms/:id/messages',
    authenticate,
    validateParams(idParamSchema),
    validateQuery(paginationSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roomId = parseInt(req.params.id);
            const { page, limit } = req.query as unknown as z.infer<typeof paginationSchema>;
            const userId = req.user!.id;

            // Check if user is member
            const isMember = await prisma.chatRoomMember.findUnique({
                where: {
                    roomId_userId: { roomId, userId },
                },
            });

            if (!isMember) {
                errorResponse(res, 'Not a member of this room', 403);
                return;
            }

            const skip = (page - 1) * limit;

            const [messages, total] = await Promise.all([
                prisma.chatMessage.findMany({
                    where: { roomId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: {
                            select: { id: true, fullName: true, email: true, avatar: true },
                        },
                    },
                }),
                prisma.chatMessage.count({ where: { roomId } }),
            ]);

            // Mark messages as read
            await prisma.chatMessage.updateMany({
                where: {
                    roomId,
                    senderId: { not: userId },
                    isRead: false,
                },
                data: { isRead: true },
            });

            paginatedResponse(res, messages.reverse(), { page, limit, total });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/chat/rooms/:id/messages - Send message
router.post(
    '/rooms/:id/messages',
    authenticate,
    validateParams(idParamSchema),
    validateBody(sendMessageSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roomId = parseInt(req.params.id);
            const { content } = req.body;
            const userId = req.user!.id;

            // Check if user is member
            const isMember = await prisma.chatRoomMember.findUnique({
                where: {
                    roomId_userId: { roomId, userId },
                },
            });

            if (!isMember) {
                errorResponse(res, 'Not a member of this room', 403);
                return;
            }

            const message = await prisma.chatMessage.create({
                data: {
                    roomId,
                    senderId: userId,
                    content,
                },
                include: {
                    sender: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                },
            });

            // Update room's updatedAt
            await prisma.chatRoom.update({
                where: { id: roomId },
                data: { updatedAt: new Date() },
            });

            successResponse(res, message, undefined, 201);
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/chat/rooms/:id - Leave room
router.delete(
    '/rooms/:id',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roomId = parseInt(req.params.id);
            const userId = req.user!.id;

            const membership = await prisma.chatRoomMember.findUnique({
                where: {
                    roomId_userId: { roomId, userId },
                },
            });

            if (!membership) {
                errorResponse(res, 'Not a member of this room', 404);
                return;
            }

            // For private chat, just leave
            // For group chat, leave if more than 2 members
            const room = await prisma.chatRoom.findUnique({
                where: { id: roomId },
                include: { _count: { select: { members: true } } },
            });

            if (!room) {
                errorResponse(res, 'Room not found', 404);
                return;
            }

            await prisma.chatRoomMember.delete({
                where: {
                    roomId_userId: { roomId, userId },
                },
            });

            // Delete room if no members left
            if (room._count.members <= 1) {
                await prisma.chatRoom.delete({
                    where: { id: roomId },
                });
            }

            successResponse(res, null, 'Left chat room successfully');
        } catch (error) {
            next(error);
        }
    }
);

export default router;
