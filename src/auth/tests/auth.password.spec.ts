import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';

describe('AuthModule - Password Management', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
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

  describe('forgotPassword', () => {
    it('T-A-25: Forgot password valid email → 200 always', async () => {
      mockAuthService.forgotPassword.mockResolvedValue({ message: 'If this email is registered, an OTP has been sent.' });
      expect(await controller.forgotPassword({ email: 'test@example.com' })).toEqual({ message: 'If this email is registered, an OTP has been sent.' });
    });
  });

  describe('resetPassword', () => {
    const dto: ResetPasswordDto = { email: 'test@example.com', otp: '123456', newPassword: 'Pass', confirmPassword: 'Pass' };

    it('T-A-27: Reset with valid OTP + strong password → 200', async () => {
      mockAuthService.resetPassword.mockResolvedValue({ message: 'Password reset successful' });
      expect(await controller.resetPassword(dto)).toEqual({ message: 'Password reset successful' });
    });

    it('T-A-28: Reset with wrong OTP → 400', async () => {
      mockAuthService.resetPassword.mockRejectedValue(new BadRequestException('Invalid OTP'));
      await expect(controller.resetPassword(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    const dto: ChangePasswordDto = { currentPassword: 'Old', newPassword: 'New', confirmPassword: 'New' };
    const userId = 'user-id';

    it('T-A-31: Change password with correct current password → 200', async () => {
      mockAuthService.changePassword.mockResolvedValue({ message: 'Password changed successfully' });
      expect(await controller.changePassword(userId, dto)).toEqual({ message: 'Password changed successfully' });
    });

    it('T-A-32: Change password with wrong current password → 401', async () => {
      mockAuthService.changePassword.mockRejectedValue(new UnauthorizedException('Wrong current password'));
      await expect(controller.changePassword(userId, dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
