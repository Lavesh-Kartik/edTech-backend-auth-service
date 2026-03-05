import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';

describe('AuthModule - Tokens', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  const mockRedisService = {};
  const mockConfigService = {};

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('refresh', () => {
    it('T-A-39: Refresh token rotation → 200', async () => {
      const result = { access_token: 'new', refresh_token: 'new', token_type: 'Bearer', expires_in: 900 };
      mockAuthService.refresh.mockResolvedValue(result);
      expect(await controller.refresh('valid-refresh-token')).toEqual(result);
    });

    it('T-A-41: Expired refresh token → 401', async () => {
      mockAuthService.refresh.mockRejectedValue(new UnauthorizedException('Invalid or expired token'));
      await expect(controller.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('T-A-37: Logout with valid token → 200', async () => {
      mockAuthService.logout.mockResolvedValue({ message: 'Logged out successfully' });
      // We need to mock the request object for logout
      const req = { headers: { authorization: 'Bearer valid.token.here' } };
      // Also need to handle token decoding inside controller.
      // Since we can't easily mock the internal jwt decode in the controller without extra setup or changing controller,
      // we might want to refactor controller or just mock the dependencies.
      // The controller does: `JSON.parse(Buffer.from(parts[1], 'base64').toString())`
      // We need a valid base64 payload.
      const payload = JSON.stringify({ jti: 'jti-uuid' });
      const token = `header.${Buffer.from(payload).toString('base64')}.signature`;
      req.headers.authorization = `Bearer ${token}`;

      expect(await controller.logout('user-id', req)).toEqual({ message: 'Logged out successfully' });
      expect(mockAuthService.logout).toHaveBeenCalledWith('user-id', 'jti-uuid');
    });
  });
});
