import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { ACCESS_TOKEN_KEY } from '../../redis/redis.constants';
import { JwtPayload } from '../types/jwt-payload.type';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Buffer.from(configService.get<string>('jwt.publicKey'), 'base64').toString('utf-8'),
      algorithms: ['RS256'],
      issuer: configService.get<string>('jwt.issuer'),
      audience: configService.get<string>('jwt.audience'),
    });
  }

  async validate(payload: JwtPayload) {
    const tokenExists = await this.redisService.exists(ACCESS_TOKEN_KEY(payload.jti));
    if (!tokenExists) {
      throw new UnauthorizedException('Token revoked');
    }
    
    // Security Hardening: Verify user still exists and is active/verified
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
        throw new UnauthorizedException('User not found');
    }
    if (!user.isActive) {
        throw new UnauthorizedException('User is inactive');
    }
    if (!user.isEmailVerified) {
        throw new UnauthorizedException('Email not verified');
    }

    return user;
  }
}
