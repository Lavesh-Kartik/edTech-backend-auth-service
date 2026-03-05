import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().required(),
  API_PREFIX: Joi.string().default('api/v1'),

  DATABASE_URL: Joi.string().required(),

  REDIS_URL: Joi.string().required(),
  REDIS_KEY_PREFIX: Joi.string().default('auth:'),

  JWT_PRIVATE_KEY: Joi.string().required(),
  JWT_PUBLIC_KEY: Joi.string().required(),
  JWT_ACCESS_TTL: Joi.number().default(900),
  JWT_REFRESH_TTL: Joi.number().default(604800),
  JWT_ISSUER: Joi.string().required(),
  JWT_AUDIENCE: Joi.string().required(),

  SENDGRID_API_KEY: Joi.string().required(),
  SENDGRID_FROM_EMAIL: Joi.string().required(),
  SENDGRID_FROM_NAME: Joi.string().required(),
  SENDGRID_TEMPLATE_VERIFY: Joi.string().required(),
  SENDGRID_TEMPLATE_RESET: Joi.string().required(),
  SENDGRID_TEMPLATE_WELCOME: Joi.string().required(),
  SENDGRID_TEMPLATE_PWD_CHANGED: Joi.string().required(),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),

  GITHUB_CLIENT_ID: Joi.string().required(),
  GITHUB_CLIENT_SECRET: Joi.string().required(),
  GITHUB_CALLBACK_URL: Joi.string().required(),

  OTP_TTL_SECONDS: Joi.number().default(600),
  OTP_MAX_ATTEMPTS: Joi.number().default(3),
  OTP_MAX_RESENDS: Joi.number().default(3),
  OTP_RESEND_WINDOW_SECONDS: Joi.number().default(1800),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(5),

  BCRYPT_ROUNDS: Joi.number().default(12),
});
