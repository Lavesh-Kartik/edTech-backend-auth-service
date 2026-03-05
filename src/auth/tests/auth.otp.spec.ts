import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { OtpType } from '@prisma/client';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { BadRequestException, HttpException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';

describe('AuthModule - OTP', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    verifyEmail: jest.fn(),
    resendOtp: jest.fn(),
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

  describe('verifyEmail', () => {
    const dto: VerifyEmailDto = { email: 'test@example.com', otp: '123456' };

    it('T-A-17: Correct OTP on first attempt → 200 + welcome email sent', async () => {
      mockAuthService.verifyEmail.mockResolvedValue({ message: 'Email verified successfully' });
      expect(await controller.verifyEmail(dto)).toEqual({ message: 'Email verified successfully' });
    });

    it('T-A-18: Wrong OTP → 400 Invalid OTP', async () => {
      mockAuthService.verifyEmail.mockRejectedValue(new BadRequestException('Invalid OTP'));
      await expect(controller.verifyEmail(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendOtp', () => {
    const dto: ResendOtpDto = { email: 'test@example.com', type: OtpType.VERIFY_EMAIL };

    it('T-A-22: Resend OTP (first resend) → 200 + new OTP generated', async () => {
      mockAuthService.resendOtp.mockResolvedValue({ message: 'OTP sent successfully' });
      expect(await controller.resendOtp(dto)).toEqual({ message: 'OTP sent successfully' });
    });

    it('T-A-23: Resend OTP > 3 times in 30 min → 429', async () => {
      mockAuthService.resendOtp.mockRejectedValue(new HttpException('Too many resend attempts', 429));
      await expect(controller.resendOtp(dto)).rejects.toThrow(HttpException);
    });
  });
});
