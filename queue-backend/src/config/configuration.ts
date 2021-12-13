export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },
  queue: {
    ghost_away_threshold: process.env.GHOST_AWAY_THRESHOLD || 300000, // 1000 * 60 * 5 = 5 Minutes
  }
});