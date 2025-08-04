import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { redisClient, REDIS_KEYS } from '../config/redis';
import { logger } from '../utils/logger';

interface AuthenticatedSocket {
  id: string;
  userId: string;
  user: User;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: any) => void;
  on: (event: string, handler: (data: any) => void) => void;
  disconnect: () => void;
}

export function setupSocketHandlers(io: SocketIOServer) {
  // Authentication middleware
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.userId } });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId}`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Update user presence
    await updateUserPresence(socket.userId, true);

    // Handle typing events
    socket.on('typing', async (data: { matchId: string; isTyping: boolean }) => {
      const { matchId, isTyping } = data;
      
      // Broadcast typing status to the other user in the match
      socket.to(`match:${matchId}`).emit('userTyping', {
        userId: socket.userId,
        isTyping
      });
    });

    // Handle voice call events
    socket.on('voiceCall', async (data: { matchId: string; type: 'offer' | 'answer' | 'ice-candidate'; payload: any }) => {
      const { matchId, type, payload } = data;
      
      // Forward voice call data to the other user
      socket.to(`match:${matchId}`).emit('voiceCall', {
        from: socket.userId,
        type,
        payload
      });
    });

    // Handle video call events
    socket.on('videoCall', async (data: { matchId: string; type: 'offer' | 'answer' | 'ice-candidate'; payload: any }) => {
      const { matchId, type, payload } = data;
      
      // Forward video call data to the other user
      socket.to(`match:${matchId}`).emit('videoCall', {
        from: socket.userId,
        type,
        payload
      });
    });

    // Handle match room joining
    socket.on('joinMatch', async (matchId: string) => {
      socket.join(`match:${matchId}`);
      logger.info(`User ${socket.userId} joined match: ${matchId}`);
    });

    // Handle match room leaving
    socket.on('leaveMatch', async (matchId: string) => {
      socket.leave(`match:${matchId}`);
      logger.info(`User ${socket.userId} left match: ${matchId}`);
    });

    // Handle user activity updates
    socket.on('activity', async (activity: string) => {
      await redisClient.setEx(
        `activity:${socket.userId}`,
        300, // 5 minutes TTL
        activity
      );

      // Broadcast activity to relevant matches
      const matches = await getUserActiveMatches(socket.userId);
      matches.forEach(matchId => {
        socket.to(`match:${matchId}`).emit('userActivity', {
          userId: socket.userId,
          activity
        });
      });
    });

    // Handle location updates
    socket.on('locationUpdate', async (location: { latitude: number; longitude: number }) => {
      const userRepository = AppDataSource.getRepository(User);
      await userRepository.update(socket.userId, { location });
      
      logger.info(`Location updated for user: ${socket.userId}`);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${socket.userId}`);
      await updateUserPresence(socket.userId, false);
      
      // Clean up presence data
      await redisClient.del(`activity:${socket.userId}`);
    });
  });
}

async function updateUserPresence(userId: string, isOnline: boolean) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    await userRepository.update(userId, {
      isOnline,
      lastSeen: new Date()
    });

    // Update presence in Redis
    if (isOnline) {
      await redisClient.setEx(REDIS_KEYS.USER_PRESENCE(userId), 300, 'online');
    } else {
      await redisClient.del(REDIS_KEYS.USER_PRESENCE(userId));
    }
  } catch (error) {
    logger.error('Error updating user presence:', error);
  }
}

async function getUserActiveMatches(userId: string): Promise<string[]> {
  try {
    const matchRepository = AppDataSource.getRepository(require('../models/Match').Match);
    const matches = await matchRepository.find({
      where: [
        { user1Id: userId, status: 'active' },
        { user2Id: userId, status: 'active' }
      ],
      select: ['id']
    });

    return matches.map(match => match.id);
  } catch (error) {
    logger.error('Error getting user active matches:', error);
    return [];
  }
}

// Helper function to emit to specific users
export function emitToUser(io: SocketIOServer, userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data);
}

// Helper function to emit to match participants
export function emitToMatch(io: SocketIOServer, matchId: string, event: string, data: any) {
  io.to(`match:${matchId}`).emit(event, data);
}