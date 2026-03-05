import {
  Injectable,
  ConflictException,
  UnprocessableEntityException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokensService } from '../tokens/tokens.service';
import { OtpService } from '../otp/otp.service';
import { MailerService } from '../mailer/mailer.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User, OtpType, AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile } from './types/oauth-profile.type';
import { OAUTH_STATE_KEY, ACCESS_TOKEN_KEY } from '../redis/redis.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly otpService: OtpService,
    private readonly mailerService: MailerService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      dto.password,
      this.configService.get<number>('app.bcryptRounds'),
    );

    const user = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash: hashedPassword,
      authProvider: AuthProvider.LOCAL,
    });

    const otp = await this.otpService.generateOtp(user.email, OtpType.VERIFY_EMAIL);
    await this.mailerService.sendVerificationEmail(user.email, user.fullName, otp);

    return { message: 'User registered successfully', userId: user.id };
  }

  async login(user: User) {
    if (!user.isEmailVerified) {
      throw new ForbiddenException('Email not verified');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    const accessToken = await this.tokensService.generateAccessToken(user);
    const refreshToken = await this.tokensService.generateRefreshToken(user);

    await this.usersService.update(user.id, { lastLoginAt: new Date() });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: this.configService.get('jwt.accessTtl'),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        return user;
      }
    }
    return null;
  }

  async refresh(refreshToken: string) {
    const tokens = await this.tokensService.rotateRefreshToken(refreshToken);
    return {
      ...tokens,
      token_type: 'Bearer',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    await this.otpService.verifyOtp(dto.email, dto.otp, OtpType.VERIFY_EMAIL);
    const user = await this.usersService.findByEmail(dto.email);
    if (user) {
      await this.usersService.update(user.id, { isEmailVerified: true });
      await this.mailerService.sendWelcomeEmail(user.email, user.fullName);
    }
    return { message: 'Email verified successfully' };
  }

  async resendOtp(dto: ResendOtpDto) {
    await this.otpService.checkResendRateLimit(dto.email, dto.type);
    
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
       return { message: 'OTP sent successfully' };
    }

    const otp = await this.otpService.generateOtp(dto.email, dto.type);
    if (dto.type === OtpType.VERIFY_EMAIL) {
      await this.mailerService.sendVerificationEmail(user.email, user.fullName, otp);
    } else if (dto.type === OtpType.RESET_PASSWORD) {
      await this.mailerService.sendPasswordResetEmail(user.email, user.fullName, otp);
    }

    return { message: 'OTP sent successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (user) {
      const otp = await this.otpService.generateOtp(user.email, OtpType.RESET_PASSWORD);
      await this.mailerService.sendPasswordResetEmail(user.email, user.fullName, otp);
    }
    return { message: 'If this email is registered, an OTP has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    await this.otpService.verifyOtp(dto.email, dto.otp, OtpType.RESET_PASSWORD);
    
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
       throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      this.configService.get<number>('app.bcryptRounds'),
    );

    await this.usersService.update(user.id, { passwordHash: hashedPassword });
    await this.tokensService.revokeAllUserTokens(user.id);
    await this.mailerService.sendPasswordChangedEmail(user.email, user.fullName, 'unknown'); 

    return { message: 'Password reset successful' };
  }

  async logout(userId: string, jti: string) {
    await this.tokensService.revokeAllUserTokens(userId);
    await this.redisService.del(ACCESS_TOKEN_KEY(jti));
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.passwordHash) {
       throw new UnauthorizedException('Invalid user');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Wrong current password');
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      this.configService.get<number>('app.bcryptRounds'),
    );

    await this.usersService.update(userId, { passwordHash: hashedPassword });
    await this.tokensService.revokeAllUserTokens(userId);
    await this.mailerService.sendPasswordChangedEmail(user.email, user.fullName, 'unknown');

    return { message: 'Password changed successfully' };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.usersService.update(userId, dto);
  }

  async validateOAuthLogin(profile: OAuthProfile, provider: AuthProvider) {
    let user = await this.usersService.findByEmail(profile.email);

    if (user) {
        // Link account or update
        if (user.authProvider !== provider) {
            // Already registered with different provider or local. 
            // We can link it by updating providerId if not set, or just log them in.
            // But if `providerId` is different, it might be conflict.
            // For simplicity, we just log them in and maybe update providerId if missing.
            if (!user.providerId) {
                await this.usersService.update(user.id, { 
                    providerId: profile.id,
                    authProvider: provider, // Switch provider to OAuth? Or keep LOCAL?
                    // Usually keep original, but link OAuth identity.
                    // But schema has single `authProvider` field.
                    // If we want to support multiple, we need `Account` table.
                    // With single field, we can only support one primary provider.
                    // I'll leave it as is, just log in.
                });
            }
        }
    } else {
        // Try by providerId
        user = await this.usersService.findByProviderId(profile.id);
        if (!user) {
            // Create new
            user = await this.usersService.create({
                email: profile.email,
                fullName: profile.displayName,
                avatarUrl: profile.avatarUrl,
                providerId: profile.id,
                authProvider: provider,
                isEmailVerified: true,
                role: 'STUDENT',
                isActive: true,
            });
        }
    }

    return this.login(user);
  }

  getJwks() {
    return this.tokensService.getJwks();
  }
}
