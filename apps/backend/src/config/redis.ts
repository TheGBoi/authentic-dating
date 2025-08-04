import { createClient } from 'redis';

export const redisClient = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0'),
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

export const connectRedis = async () => {
  await redisClient.connect();
};

// Redis keys
export const REDIS_KEYS = {
  USER_SESSION: (userId: string) => `session:${userId}`,
  USER_PRESENCE: (userId: string) => `presence:${userId}`,
  MATCH_QUEUE: (userId: string) => `queue:${userId}`,
  ICEBREAKERS_CACHE: 'icebreakers:cache',
  PERSONALITY_CACHE: (userId: string) => `personality:${userId}`,
  RATE_LIMIT: (ip: string) => `rate_limit:${ip}`,
};