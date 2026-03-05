export const REDIS_CONSTANTS = {
  ACCESS_TOKEN_TTL: 900,
  REFRESH_TOKEN_TTL: 604800,
  OTP_TTL: 600,
  OTP_RESEND_WINDOW: 1800,
  OAUTH_STATE_TTL: 300,
  RATE_LIMIT_WINDOW: 60,
};

export const ACCESS_TOKEN_KEY = (jti: string) => `auth:access:${jti}`;
export const REFRESH_TOKEN_KEY = (userId: string) => `auth:refresh:${userId}`;
export const OTP_KEY = (email: string, type: string) => `otp:${email}:${type}`;
export const OTP_RESEND_KEY = (email: string, type: string) => `otp:resend:${email}:${type}`;
export const RATE_LIMIT_KEY = (ip: string) => `ratelimit:auth:${ip}`;
export const OAUTH_STATE_KEY = (state: string) => `session:oauth:${state}`;
