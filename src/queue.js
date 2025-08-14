import Queue from 'bull';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl);
export const postQueue = new Queue('posts', redisUrl);
