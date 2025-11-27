import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import Redis from 'redis';

let io: SocketIOServer;
const userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };
      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    logger.info(`WebSocket connected: ${socket.id} (User: ${userId})`);

    // Track user's sockets
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Subscribe to user's job updates
    socket.join(`user:${userId}`);

    // Handle job subscription
    socket.on('subscribe:job', (jobId: string) => {
      socket.join(`job:${jobId}`);
      logger.info(`Socket ${socket.id} subscribed to job ${jobId}`);
    });

    // Handle job unsubscription
    socket.on('unsubscribe:job', (jobId: string) => {
      socket.leave(`job:${jobId}`);
      logger.info(`Socket ${socket.id} unsubscribed from job ${jobId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`WebSocket disconnected: ${socket.id}`);
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
        }
      }
    });

    // Send initial connection success
    socket.emit('connected', {
      message: 'WebSocket connected successfully',
      userId
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

// Emit job status update to specific user
export function emitJobUpdate(userId: string, jobId: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).to(`job:${jobId}`).emit('job:update', {
      jobId,
      ...data,
      timestamp: new Date().toISOString()
    });
    logger.info(`Job update emitted for job ${jobId}`);
  }
}

// Emit job progress update
export function emitJobProgress(userId: string, jobId: string, progress: number, message?: string) {
  if (io) {
    io.to(`user:${userId}`).to(`job:${jobId}`).emit('job:progress', {
      jobId,
      progress,
      message,
      timestamp: new Date().toISOString()
    });
  }
}

// Emit job completion
export function emitJobComplete(userId: string, jobId: string, result: any) {
  if (io) {
    io.to(`user:${userId}`).to(`job:${jobId}`).emit('job:complete', {
      jobId,
      result,
      timestamp: new Date().toISOString()
    });
    logger.info(`Job completion emitted for job ${jobId}`);
  }
}

// Emit job error
export function emitJobError(userId: string, jobId: string, error: string) {
  if (io) {
    io.to(`user:${userId}`).to(`job:${jobId}`).emit('job:error', {
      jobId,
      error,
      timestamp: new Date().toISOString()
    });
    logger.error(`Job error emitted for job ${jobId}: ${error}`);
  }
}

// Emit credit update
export function emitCreditUpdate(userId: string, credits: number) {
  if (io) {
    io.to(`user:${userId}`).emit('credits:update', {
      credits,
      timestamp: new Date().toISOString()
    });
  }
}

// Get connected users count
export function getConnectedUsersCount(): number {
  return userSockets.size;
}

// Check if user is connected
export function isUserConnected(userId: string): boolean {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}

export { io };
