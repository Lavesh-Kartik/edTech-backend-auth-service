import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
  jti: string;
  iss: string;
  aud: string;
  iat?: number;
  exp?: number;
}
