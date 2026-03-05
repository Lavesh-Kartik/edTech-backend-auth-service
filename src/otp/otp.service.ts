import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpType } from '@prisma/client';
import { generateOtpCode } from '../common/utils/otp.util';
import { OTP_KEY, OTP_RESEND_KEY } from '../redis/redis.constants';

@Injectable()
export class OtpService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async generateOtp(email: string, type: OtpType): Promise<string> {
    const otp = generateOtpCode();
    const ttl = this.configService.get<number>('app.otpTtlSeconds') || 600;
    const key = OTP_KEY(email, type);

    await this.redisService.set(key, JSON.stringify({ otp, attempts: 0 }), ttl);

    await this.prisma.otpRecord.create({
      data: {
        email,
        otpType: type,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    return otp;
  }

  async verifyOtp(email: string, otp: string, type: OtpType): Promise<void> {
    const key = OTP_KEY(email, type);
    const dataString = await this.redisService.get(key);

    if (!dataString) {
      throw new BadRequestException('OTP has expired or does not exist');
    }

    const data = JSON.parse(dataString);
    const maxAttempts = this.configService.get<number>('app.otpMaxAttempts') || 3;

    if (data.attempts >= maxAttempts) {
      throw new BadRequestException('Maximum attempts exceeded');
    }

    data.attempts += 1;
    const ttl = await this.redisService.getTtl(key);
    if (ttl > 0) {
       await this.redisService.set(key, JSON.stringify(data), ttl);
    }

    if (data.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.redisService.del(key);

    const record = await this.prisma.otpRecord.findFirst({
      where: { email, otpType: type, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (record) {
      await this.prisma.otpRecord.update({
        where: { id: record.id },
        data: { isUsed: true },
      });
    }
  }

  async checkResendRateLimit(email: string, type: OtpType): Promise<void> {
    const key = OTP_RESEND_KEY(email, type);
    const countString = await this.redisService.get(key);
    const count = countString ? parseInt(countString, 10) : 0;
    const maxResends = this.configService.get<number>('app.otpMaxResends') || 3;

    if (count >= maxResends) {
      throw new HttpException('Too many resend attempts', 429);
    }

    await this.redisService.incr(key);
    if (count === 0) {
      const window = this.configService.get<number>('app.otpResendWindowSeconds') || 1800;
      await this.redisService.expire(key, window);
    }
  }
}
