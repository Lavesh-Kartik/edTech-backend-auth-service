import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';

describe('AuthModule - OAuth', () => {
  let controller: AuthController;
  let authService: AuthService;
  let redisService: RedisService;
  let configService: ConfigService;

  const mockAuthService = {
    validateOAuthLogin: jest.fn(),
  };

  const mockRedisService = {
    exists: jest.fn(),
    del: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('googleAuthCallback', () => {
    const req = {
      query: { state: 'valid-state' },
      user: { email: 'test@gmail.com', id: 'google-id' },
    };
    const res = {
      redirect: jest.fn(),
    } as unknown as Response;

    it('T-A-42: Google OAuth new user → user created + JWT issued', async () => {
      mockRedisService.exists.mockResolvedValue(true);
      mockAuthService.validateOAuthLogin.mockResolvedValue({ access_token: 'at', refresh_token: 'rt' });
      mockConfigService.get.mockReturnValue('http://frontend.com');

      await controller.googleAuthCallback(req, res);

      expect(mockRedisService.exists).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalled();
      expect(mockAuthService.validateOAuthLogin).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('http://frontend.com/auth/callback?token=at&refresh=rt');
    });

    it('T-A-45: OAuth callback tampered state → 400 CSRF protection', async () => {
      mockRedisService.exists.mockResolvedValue(false);
      await expect(controller.googleAuthCallback(req, res)).rejects.toThrow(BadRequestException);
    });
  });
});
