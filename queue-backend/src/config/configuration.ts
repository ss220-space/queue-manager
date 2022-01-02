import { randomBytes } from 'crypto';

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  internalIPs: process.env.INTERNAL_IPS.split(' ') || [
    '::1',
    '127.0.0.1',
  ],
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },
  queue: {
    ghost_away_threshold: process.env.GHOST_AWAY_THRESHOLD || 300000, // 1000 * 60 * 5 = 5 Minutes
  },
  jwt: {
    secret: process.env.JWT_KEY || randomBytes(256).toString('base64'), // Fallback secret for dev environment
  },
});