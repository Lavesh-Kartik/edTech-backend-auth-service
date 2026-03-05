import { Test, TestingModule } from '@nestjs/testing';
import { TokensService } from '../tokens.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { User, UserRole } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('../../common/utils/crypto.util', () => ({
  hashToken: jest.fn().mockReturnValue('hashed'),
}));

describe('TokensService', () => {
  let service: TokensService;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let redisService: RedisService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'jwt.accessTtl') return 900;
      if (key === 'jwt.refreshTtl') return 1000;
      return 'val';
    }),
  };

  const mockPrismaService = {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockRedisService = {
    set: jest.fn(),
    exists: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate token', async () => {
      const user = { id: 'uid', email: 'e', role: UserRole.STUDENT, isEmailVerified: true } as User;
      mockJwtService.sign.mockReturnValue('jwt_token');
      
      const result = await service.generateAccessToken(user);
      
      expect(result).toBe('jwt_token');
      expect(redisService.set).toHaveBeenCalled();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token and store in DB', async () => {
      const user = { id: 'uid' } as User;
      
      const result = await service.generateRefreshToken(user);
      
      expect(result).toBeDefined();
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
    });
  });

  describe('validateAccessToken', () => {
    it('should validate token', async () => {
      mockJwtService.verify.mockReturnValue({ jti: 'jti' });
      mockRedisService.exists.mockResolvedValue(true);
      
      const result = await service.validateAccessToken('token');
      expect(result).toBeDefined();
    });

    it('should throw if token revoked (not in redis)', async () => {
      mockJwtService.verify.mockReturnValue({ jti: 'jti' });
      mockRedisService.exists.mockResolvedValue(false);
      
      await expect(service.validateAccessToken('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if verify fails', async () => {
        mockJwtService.verify.mockImplementation(() => { throw new Error('err'); });
        await expect(service.validateAccessToken('token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('rotateRefreshToken', () => {
      it('should rotate valid token', async () => {
          const oldToken = 'old';
          const user = { id: 'uid', email: 'e' } as User;
          const rtRecord = { id: 'rtid', userId: 'uid', isRevoked: false, expiresAt: new Date(Date.now() + 10000), user };
          
          mockPrismaService.refreshToken.findUnique.mockResolvedValue(rtRecord);
          mockRedisService.get.mockResolvedValue('jti');
          mockJwtService.sign.mockReturnValue('new_at');
          
          const result = await service.rotateRefreshToken(oldToken);
          
          expect(result.accessToken).toBe('new_at');
          expect(prismaService.refreshToken.update).toHaveBeenCalledWith({ where: { id: 'rtid' }, data: { isRevoked: true } });
          expect(redisService.del).toHaveBeenCalled();
      });

      it('should revoke all if replay detected (revoked token used)', async () => {
        const rtRecord = { id: 'rtid', userId: 'uid', isRevoked: true, expiresAt: new Date(Date.now() + 10000) };
        mockPrismaService.refreshToken.findUnique.mockResolvedValue(rtRecord);
        
        await expect(service.rotateRefreshToken('old')).rejects.toThrow(UnauthorizedException);
        expect(prismaService.refreshToken.updateMany).toHaveBeenCalled(); // revokeAllUserTokens
      });
  });
});
