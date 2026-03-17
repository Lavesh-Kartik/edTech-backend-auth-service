import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { GithubAuthGuard } from '../guards/github-auth.guard';
import { RedisService } from '../../redis/redis.service';
import { ExecutionContext } from '@nestjs/common';
import * as crypto from 'crypto';

describe('Auth Guards', () => {
  let googleGuard: GoogleAuthGuard;
  let githubGuard: GithubAuthGuard;
  let redisService: RedisService;

  const mockRedisService = {
    set: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({}),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthGuard,
        GithubAuthGuard,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    googleGuard = module.get<GoogleAuthGuard>(GoogleAuthGuard);
    githubGuard = module.get<GithubAuthGuard>(GithubAuthGuard);
    redisService = module.get<RedisService>(RedisService);
    
    jest.spyOn(crypto, 'randomBytes').mockImplementation(() => ({ toString: () => 'random-state' } as any));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GoogleAuthGuard', () => {
    it('canActivate should generate state and store in redis', async () => {
      // Mock super.canActivate
      const canActivateSpy = jest.spyOn(require('@nestjs/passport').AuthGuard('google').prototype, 'canActivate')
        .mockResolvedValue(true);
      
      await googleGuard.canActivate(mockExecutionContext);
      
      expect(redisService.set).toHaveBeenCalled();
      const req = mockExecutionContext.switchToHttp().getRequest();
      expect(req.oauthState).toBe('random-state');
    });

    it('getAuthenticateOptions should return state', () => {
        const req = { oauthState: 'state' };
        const ctx = {
            switchToHttp: () => ({ getRequest: () => req }),
        } as any;
        
        expect(googleGuard.getAuthenticateOptions(ctx)).toEqual({ state: 'state' });
    });
  });

  describe('GithubAuthGuard', () => {
    it('canActivate should generate state and store in redis', async () => {
      jest.spyOn(require('@nestjs/passport').AuthGuard('github').prototype, 'canActivate')
        .mockResolvedValue(true);
      
      await githubGuard.canActivate(mockExecutionContext);
      
      expect(redisService.set).toHaveBeenCalled();
    });

    it('getAuthenticateOptions should return state', () => {
        const req = { oauthState: 'state' };
        const ctx = {
            switchToHttp: () => ({ getRequest: () => req }),
        } as any;
        
        expect(githubGuard.getAuthenticateOptions(ctx)).toEqual({ state: 'state' });
    });
  });
});
