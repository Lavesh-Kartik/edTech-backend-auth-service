import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RedisService } from '../../redis/redis.service';
import { OAUTH_STATE_KEY } from '../../redis/redis.constants';
import * as crypto from 'crypto';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const state = crypto.randomBytes(16).toString('hex');
    const key = OAUTH_STATE_KEY(state);
    
    await this.redisService.set(key, '1', 300);
    request.oauthState = state;
    
    const result = await super.canActivate(context);
    return result as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return {
      state: request.oauthState,
    };
  }
}
