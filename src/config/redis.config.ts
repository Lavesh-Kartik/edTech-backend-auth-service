import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.REDIS_URL,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'auth:',
}));
