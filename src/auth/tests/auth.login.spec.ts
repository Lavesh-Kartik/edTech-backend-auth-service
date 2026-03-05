import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';
import { UnauthorizedException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { User, UserRole, AuthProvider } from '@prisma/client';

describe('AuthModule - Login', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
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

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockUser: User = {
      id: 'uuid',
      email: 'test@example.com',
      fullName: 'Test User',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
      isEmailVerified: true,
      isActive: true,
      authProvider: AuthProvider.LOCAL,
      providerId: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatarUrl: null,
    };

    it('T-A-11: Valid credentials + verified email → 200 + access_token + refresh_token', async () => {
      const result = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        token_type: 'Bearer',
        expires_in: 900,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
          role: mockUser.role,
          avatarUrl: mockUser.avatarUrl,
        },
      };
      mockAuthService.login.mockResolvedValue(result);

      // In the controller, @CurrentUser() decorator injects the user. We simulate this by passing the user directly if calling the method.
      // But we are unit testing the controller method.
      expect(await controller.login(mockUser)).toEqual(result);
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
    });

    it('T-A-10: Valid credentials + unverified email → 403 email not verified', async () => {
      mockAuthService.login.mockRejectedValue(new ForbiddenException('Email not verified'));
      await expect(controller.login(mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('T-A-15: Deactivated account → 403 Account deactivated', async () => {
      mockAuthService.login.mockRejectedValue(new ForbiddenException('Account is inactive'));
      await expect(controller.login(mockUser)).rejects.toThrow(ForbiddenException);
    });
  });
});
