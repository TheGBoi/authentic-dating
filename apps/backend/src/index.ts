import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { AppDataSource } from './config/database';
import { connectRedis } from './config/redis';
import { UserResolver } from './resolvers/UserResolver';
import { MatchResolver } from './resolvers/MatchResolver';
import { MessageResolver } from './resolvers/MessageResolver';
import { PersonalityResolver } from './resolvers/PersonalityResolver';
import { authMiddleware } from './middleware/auth';
import { setupSocketHandlers } from './services/socketService';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

async function startServer() {
  try {
    // Initialize database
    await AppDataSource.initialize();
    logger.info('Database connection established');

    // Initialize Redis
    await connectRedis();
    logger.info('Redis connection established');

    // Create Express app
    const app = express();
    const httpServer = createServer(app);

    // Initialize Socket.IO
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    // Setup Socket.IO handlers
    setupSocketHandlers(io);

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }));

    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    });
    app.use('/graphql', limiter);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Build GraphQL schema
    const schema = await buildSchema({
      resolvers: [UserResolver, MatchResolver, MessageResolver, PersonalityResolver],
      authChecker: authMiddleware,
    });

    // Create Apollo Server
    const server = new ApolloServer({
      schema,
      context: ({ req, res }) => ({ req, res, io }),
      introspection: process.env.NODE_ENV !== 'production',
      debug: process.env.NODE_ENV !== 'production',
    });

    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Start server
    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
      logger.info(`🔌 Socket.IO server ready at http://localhost:${PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await AppDataSource.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await AppDataSource.destroy();
  process.exit(0);
});

startServer();