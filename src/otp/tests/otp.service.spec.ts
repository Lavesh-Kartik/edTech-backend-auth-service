import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from '../otp.service';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, HttpException } from '@nestjs/common';
import { OtpType } from '@prisma/client';

jest.mock('../../common/utils/otp.util', () => ({
  generateOtpCode: jest.fn().mockReturnValue('123456'),
}));

describe('OtpService', () => {
  let service: OtpService;
  let redisService: RedisService;
  let prismaService: PrismaService;

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    client: { ttl: jest.fn() },
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    getTtl: jest.fn(), // If used in service
  };

  const mockPrismaService = {
    otpRecord: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(() => 3), // default max attempts
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    redisService = module.get<RedisService>(RedisService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('generateOtp', () => {
    it('should generate and store OTP', async () => {
      await service.generateOtp('email', OtpType.VERIFY_EMAIL);
      expect(redisService.set).toHaveBeenCalled();
      expect(prismaService.otpRecord.create).toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('should verify valid otp', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify({ otp: '123456', attempts: 0 }));
      mockRedisService.client.ttl.mockResolvedValue(100); // Wait, check service impl for getTtl usage
      // The service uses `this.redisService.getTtl` now.
      mockRedisService.getTtl.mockResolvedValue(100);
      mockPrismaService.otpRecord.findFirst.mockResolvedValue({ id: 'oid' });

      await service.verifyOtp('email', '123456', OtpType.VERIFY_EMAIL);
      
      expect(redisService.del).toHaveBeenCalled();
      expect(prismaService.otpRecord.update).toHaveBeenCalled();
    });

    it('should throw if otp expired', async () => {
      mockRedisService.get.mockResolvedValue(null);
      await expect(service.verifyOtp('email', '1', OtpType.VERIFY_EMAIL)).rejects.toThrow(BadRequestException);
    });

    it('should throw if max attempts', async () => {
        mockRedisService.get.mockResolvedValue(JSON.stringify({ otp: '123456', attempts: 3 }));
        await expect(service.verifyOtp('email', '1', OtpType.VERIFY_EMAIL)).rejects.toThrow(BadRequestException);
    });

    it('should throw if invalid otp', async () => {
        mockRedisService.get.mockResolvedValue(JSON.stringify({ otp: '123456', attempts: 0 }));
        mockRedisService.getTtl.mockResolvedValue(100);
        await expect(service.verifyOtp('email', 'wrong', OtpType.VERIFY_EMAIL)).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkResendRateLimit', () => {
      it('should allow if limit not reached', async () => {
          mockRedisService.get.mockResolvedValue('1');
          await service.checkResendRateLimit('email', OtpType.VERIFY_EMAIL);
          expect(redisService.incr).toHaveBeenCalled();
      });

      it('should throw if limit reached', async () => {
          mockRedisService.get.mockResolvedValue('3');
          await expect(service.checkResendRateLimit('email', OtpType.VERIFY_EMAIL)).rejects.toThrow(HttpException);
      });
  });
});
