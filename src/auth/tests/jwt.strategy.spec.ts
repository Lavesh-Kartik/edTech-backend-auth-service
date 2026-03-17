import { JwtStrategy } from '../strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { UsersService } from '../../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let redisService: RedisService;
  let usersService: UsersService;

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'jwt.publicKey') return Buffer.from('public').toString('base64');
      if (key === 'jwt.issuer') return 'iss';
      if (key === 'jwt.audience') return 'aud';
      return null;
    }),
  };

  const mockRedisService = {
    exists: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    const payload = { sub: 'uid', jti: 'jti' };

    it('should return user if valid', async () => {
      mockRedisService.exists.mockResolvedValue(true);
      const user = { id: 'uid', isActive: true, isEmailVerified: true };
      mockUsersService.findById.mockResolvedValue(user);

      expect(await strategy.validate(payload as any)).toEqual(user);
    });

    it('should throw if token revoked', async () => {
      mockRedisService.exists.mockResolvedValue(false);
      await expect(strategy.validate(payload as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if user not found', async () => {
      mockRedisService.exists.mockResolvedValue(true);
      mockUsersService.findById.mockResolvedValue(null);
      await expect(strategy.validate(payload as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if user inactive', async () => {
      mockRedisService.exists.mockResolvedValue(true);
      mockUsersService.findById.mockResolvedValue({ isActive: false });
      await expect(strategy.validate(payload as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if email not verified', async () => {
      mockRedisService.exists.mockResolvedValue(true);
      mockUsersService.findById.mockResolvedValue({ isActive: true, isEmailVerified: false });
      await expect(strategy.validate(payload as any)).rejects.toThrow(UnauthorizedException);
    });
  });
});
