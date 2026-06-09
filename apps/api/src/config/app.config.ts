import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
}));
