import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';
import { RATE_LIMIT_KEY } from '../../redis/redis.constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    const key = RATE_LIMIT_KEY(ip);
    
    // Check specific limits based on endpoint if needed, but prompt says:
    // "POST /auth/login → 5 requests per 1 minute"
    // "POST /auth/register → 3 requests per 1 minute"
    // So I need to know which endpoint is being accessed.
    // I can use Reflector to get metadata, or check URL.
    // The prompt implies one global guard but with different limits?
    // "Implement a RateLimitGuard... Apply using @UseGuards(RateLimitGuard) on relevant controller methods."
    // So I can pass limits via decorator or check URL inside guard.
    // I'll check URL path or method.
    
    let limit = this.configService.get<number>('app.rateLimitMax') || 5;
    let window = this.configService.get<number>('app.rateLimitWindowMs') || 60000;
    
    if (request.url.includes('/auth/register')) {
        limit = 3;
    } else if (request.url.includes('/auth/login')) {
        limit = 5;
    }

    const current = await this.redisService.incr(key);
    if (current === 1) {
      await this.redisService.expire(key, window / 1000);
    }

    if (current > limit) {
      const ttl = await this.redisService.getTtl(key);
      const response = context.switchToHttp().getResponse();
      response.header('Retry-After', ttl);
      throw new HttpException('Too Many Requests', 429);
    }

    return true;
  }
}
