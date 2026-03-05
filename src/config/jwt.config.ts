import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  privateKey: Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64').toString('utf-8'),
  publicKey: Buffer.from(process.env.JWT_PUBLIC_KEY, 'base64').toString('utf-8'),
  accessTtl: parseInt(process.env.JWT_ACCESS_TTL, 10) || 900,
  refreshTtl: parseInt(process.env.JWT_REFRESH_TTL, 10) || 604800,
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
}));
