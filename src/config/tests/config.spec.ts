import appConfig from '../app.config';
import jwtConfig from '../jwt.config';
import redisConfig from '../redis.config';
import oauthConfig from '../oauth.config';
import brevoConfig from '../brevo.config';
import { configValidationSchema } from '../config.validation';

describe('Config', () => {
    describe('appConfig', () => {
        it('should return app config', () => {
            expect(appConfig()).toBeDefined();
        });
    });

    describe('jwtConfig', () => {
        it('should return jwt config', () => {
            process.env.JWT_PRIVATE_KEY = Buffer.from('private').toString('base64');
            process.env.JWT_PUBLIC_KEY = Buffer.from('public').toString('base64');
            expect(jwtConfig()).toBeDefined();
        });
    });

    describe('redisConfig', () => {
        it('should return redis config', () => {
            expect(redisConfig()).toBeDefined();
        });
    });

    describe('oauthConfig', () => {
        it('should return oauth config', () => {
            expect(oauthConfig()).toBeDefined();
        });
    });

    describe('brevoConfig', () => {
        it('should return brevo config', () => {
            expect(brevoConfig()).toBeDefined();
        });
    });

    describe('configValidation', () => {
        it('should validate correct config', () => {
            const config = {
                NODE_ENV: 'development',
                PORT: 3000,
                FRONTEND_URL: 'http://localhost:3000',
                DATABASE_URL: 'postgres://',
                REDIS_URL: 'redis://',
                JWT_PRIVATE_KEY: 'key',
                JWT_PUBLIC_KEY: 'key',
                JWT_ISSUER: 'iss',
                JWT_AUDIENCE: 'aud',
                BREVO_API_KEY: 'key',
                BREVO_FROM_EMAIL: 'e',
                BREVO_FROM_NAME: 'n',
                BREVO_TEMPLATE_VERIFY: 1,
                BREVO_TEMPLATE_RESET: 2,
                BREVO_TEMPLATE_WELCOME: 3,
                BREVO_TEMPLATE_PWD_CHANGED: 4,
                GOOGLE_CLIENT_ID: 'id',
                GOOGLE_CLIENT_SECRET: 's',
                GOOGLE_CALLBACK_URL: 'url',
                GITHUB_CLIENT_ID: 'id',
                GITHUB_CLIENT_SECRET: 's',
                GITHUB_CALLBACK_URL: 'url',
            };
            const { error } = configValidationSchema.validate(config);
            expect(error).toBeUndefined();
        });
    });
});
