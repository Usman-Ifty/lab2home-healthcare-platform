import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.util';

export const initializeSocket = (io: Server) => {
    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new Error('Authentication error'));
        }
        try {
            const decoded = verifyToken(token);
            socket.data.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`User connected: ${socket.data.user.id}`);

        // Join a conversation room
        socket.on('join_conversation', (conversationId: string) => {
            socket.join(conversationId);
            console.log(`User ${socket.data.user.id} joined conversation ${conversationId}`);
        });

        // Leave a conversation room
        socket.on('leave_conversation', (conversationId: string) => {
            socket.leave(conversationId);
            console.log(`User ${socket.data.user.id} left conversation ${conversationId}`);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.data.user.id}`);
        });
    });
};
