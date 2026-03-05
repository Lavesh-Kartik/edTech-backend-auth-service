import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, RedisModule, PrismaModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
