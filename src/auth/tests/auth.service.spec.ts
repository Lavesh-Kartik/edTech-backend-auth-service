import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { TokensService } from '../../tokens/tokens.service';
import { OtpService } from '../../otp/otp.service';
import { MailerService } from '../../mailer/mailer.service';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from '../dto/register.dto';
import { ConflictException, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserRole, AuthProvider, OtpType } from '@prisma/client';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let tokensService: TokensService;
  let otpService: OtpService;
  let mailerService: MailerService;
  let redisService: RedisService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findByProviderId: jest.fn(),
  };

  const mockTokensService = {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeAllUserTokens: jest.fn(),
    getJwks: jest.fn(),
  };

  const mockOtpService = {
    generateOtp: jest.fn(),
    verifyOtp: jest.fn(),
    checkResendRateLimit: jest.fn(),
  };

  const mockMailerService = {
    sendVerificationEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendPasswordChangedEmail: jest.fn(),
  };

  const mockRedisService = {
    del: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'app.bcryptRounds') return 10;
      if (key === 'jwt.accessTtl') return 900;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: TokensService, useValue: mockTokensService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: MailerService, useValue: mockMailerService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    tokensService = module.get<TokensService>(TokensService);
    otpService = module.get<OtpService>(OtpService);
    mailerService = module.get<MailerService>(MailerService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto: RegisterDto = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password',
      confirmPassword: 'password',
    };

    it('should register a new user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUsersService.create.mockResolvedValue({ id: 'userId', email: dto.email, fullName: dto.fullName } as User);
      mockOtpService.generateOtp.mockResolvedValue('123456');

      const result = await service.register(dto);

      expect(result).toEqual({ message: 'User registered successfully', userId: 'userId' });
      expect(usersService.create).toHaveBeenCalled();
      expect(otpService.generateOtp).toHaveBeenCalledWith(dto.email, 'VERIFY_EMAIL');
      expect(mailerService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'userId' } as User);
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const user = {
      id: 'userId',
      email: 'test@example.com',
      isEmailVerified: true,
      isActive: true,
      passwordHash: 'hash',
    } as User;

    it('should login user and return tokens', async () => {
      mockTokensService.generateAccessToken.mockResolvedValue('access_token');
      mockTokensService.generateRefreshToken.mockResolvedValue('refresh_token');

      const result = await service.login(user);

      expect(result.access_token).toEqual('access_token');
      expect(usersService.update).toHaveBeenCalledWith(user.id, { lastLoginAt: expect.any(Date) });
    });

    it('should throw ForbiddenException if email not verified', async () => {
      const unverifiedUser = { ...user, isEmailVerified: false };
      await expect(service.login(unverifiedUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if account inactive', async () => {
      const inactiveUser = { ...user, isActive: false };
      await expect(service.login(inactiveUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateUser', () => {
    it('should return user if password matches', async () => {
      const user = { email: 'test@example.com', passwordHash: 'hash' } as User;
      mockUsersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      expect(await service.validateUser('email', 'pass')).toBeNull();
    });

    it('should return null if password mismatch', async () => {
        const user = { email: 'test@example.com', passwordHash: 'hash' } as User;
        mockUsersService.findByEmail.mockResolvedValue(user);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
  
        const result = await service.validateUser('test@example.com', 'password');
        expect(result).toBeNull();
    });
  });

  describe('refresh', () => {
    it('should rotate tokens', async () => {
        const tokens = { accessToken: 'new_at', refreshToken: 'new_rt', expiresIn: 900 };
        mockTokensService.rotateRefreshToken.mockResolvedValue(tokens);
        
        const result = await service.refresh('old_rt');
        expect(result).toEqual({ ...tokens, token_type: 'Bearer' });
    });
  });

  describe('verifyEmail', () => {
      it('should verify email', async () => {
          const dto = { email: 'test@example.com', otp: '123456' };
          const user = { id: 'uid', email: 'test@example.com', fullName: 'name' } as User;
          
          mockOtpService.verifyOtp.mockResolvedValue(undefined);
          mockUsersService.findByEmail.mockResolvedValue(user);
          
          await service.verifyEmail(dto);
          
          expect(otpService.verifyOtp).toHaveBeenCalledWith(dto.email, dto.otp, 'VERIFY_EMAIL');
          expect(usersService.update).toHaveBeenCalledWith('uid', { isEmailVerified: true });
          expect(mailerService.sendWelcomeEmail).toHaveBeenCalled();
      });
  });

  describe('resendOtp', () => {
      it('should resend otp', async () => {
          const dto = { email: 'test@example.com', type: OtpType.VERIFY_EMAIL };
          const user = { email: 'test@example.com', fullName: 'name' } as User;
          
          mockOtpService.checkResendRateLimit.mockResolvedValue(undefined);
          mockUsersService.findByEmail.mockResolvedValue(user);
          mockOtpService.generateOtp.mockResolvedValue('123456');
          
          await service.resendOtp(dto);
          
          expect(otpService.generateOtp).toHaveBeenCalled();
          expect(mailerService.sendVerificationEmail).toHaveBeenCalled();
      });

      it('should return 200 even if user not found', async () => {
        mockUsersService.findByEmail.mockResolvedValue(null);
        await service.resendOtp({ email: 'unknown', type: OtpType.VERIFY_EMAIL });
        expect(otpService.generateOtp).not.toHaveBeenCalled();
      });
  });

  describe('forgotPassword', () => {
      it('should send reset email if user exists', async () => {
          const user = { email: 'test@example.com', fullName: 'name' } as User;
          mockUsersService.findByEmail.mockResolvedValue(user);
          mockOtpService.generateOtp.mockResolvedValue('123456');
          
          await service.forgotPassword({ email: user.email });
          
          expect(mailerService.sendPasswordResetEmail).toHaveBeenCalled();
      });
  });

  describe('resetPassword', () => {
      it('should reset password', async () => {
          const dto = { email: 'test@example.com', otp: '123', newPassword: 'new', confirmPassword: 'new' };
          const user = { id: 'uid', email: dto.email, fullName: 'name' } as User;
          
          mockOtpService.verifyOtp.mockResolvedValue(undefined);
          mockUsersService.findByEmail.mockResolvedValue(user);
          (bcrypt.hash as jest.Mock).mockResolvedValue('new_hash');
          
          await service.resetPassword(dto);
          
          expect(usersService.update).toHaveBeenCalledWith(user.id, { passwordHash: 'new_hash' });
          expect(tokensService.revokeAllUserTokens).toHaveBeenCalledWith(user.id);
      });

      it('should throw if user not found', async () => {
        mockUsersService.findByEmail.mockResolvedValue(null);
        await expect(service.resetPassword({ email: 'u', otp: '1', newPassword: 'p', confirmPassword: 'p' })).rejects.toThrow(BadRequestException);
      });
  });

  describe('logout', () => {
      it('should logout', async () => {
          await service.logout('uid', 'jti');
          expect(tokensService.revokeAllUserTokens).toHaveBeenCalledWith('uid');
          expect(redisService.del).toHaveBeenCalled(); // Should match what's in service
      });
  });

  describe('changePassword', () => {
      it('should change password', async () => {
          const user = { id: 'uid', passwordHash: 'hash', email: 'e', fullName: 'n' } as User;
          mockUsersService.findById.mockResolvedValue(user);
          (bcrypt.compare as jest.Mock).mockResolvedValue(true);
          (bcrypt.hash as jest.Mock).mockResolvedValue('new_hash');
          
          await service.changePassword('uid', { currentPassword: 'old', newPassword: 'new', confirmPassword: 'new' });
          
          expect(usersService.update).toHaveBeenCalledWith('uid', { passwordHash: 'new_hash' });
      });

      it('should throw if current password wrong', async () => {
        const user = { id: 'uid', passwordHash: 'hash' } as User;
        mockUsersService.findById.mockResolvedValue(user);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        await expect(service.changePassword('uid', { currentPassword: 'wr', newPassword: 'n', confirmPassword: 'n' })).rejects.toThrow(UnauthorizedException);
      });
  });

  describe('validateOAuthLogin', () => {
      it('should link if user exists', async () => {
          const profile = { id: 'pid', email: 'e@mail.com', displayName: 'n', avatarUrl: 'u', provider: 'google' } as any;
          const user = { id: 'uid', email: 'e@mail.com', isEmailVerified: true, isActive: true } as User;
          
          mockUsersService.findByEmail.mockResolvedValue(user);
          mockTokensService.generateAccessToken.mockResolvedValue('at');
          mockTokensService.generateRefreshToken.mockResolvedValue('rt');
          
          await service.validateOAuthLogin(profile, AuthProvider.GOOGLE);
          
          expect(usersService.update).toHaveBeenCalled();
      });

      it('should create if user does not exist', async () => {
        const profile = { id: 'pid', email: 'new@mail.com', displayName: 'n', avatarUrl: 'u', provider: 'google' } as any;
        mockUsersService.findByEmail.mockResolvedValue(null);
        mockUsersService.findByProviderId.mockResolvedValue(null);
        mockUsersService.create.mockResolvedValue({ id: 'uid', ...profile, isEmailVerified: true, isActive: true } as User);
        mockTokensService.generateAccessToken.mockResolvedValue('at');
        mockTokensService.generateRefreshToken.mockResolvedValue('rt');

        await service.validateOAuthLogin(profile, AuthProvider.GOOGLE);

        expect(usersService.create).toHaveBeenCalled();
      });
  });
});
