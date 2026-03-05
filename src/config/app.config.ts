import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 3001,
  frontendUrl: process.env.FRONTEND_URL,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
}));
