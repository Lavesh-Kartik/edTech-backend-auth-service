import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        privateKey: Buffer.from(configService.get<string>('jwt.privateKey'), 'base64').toString('utf-8'),
        publicKey: Buffer.from(configService.get<string>('jwt.publicKey'), 'base64').toString('utf-8'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: configService.get('jwt.accessTtl'),
          issuer: configService.get('jwt.issuer'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
