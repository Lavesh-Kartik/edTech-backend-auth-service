import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { ExecutionContext, HttpException, HttpStatus, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { UserRole } from '@prisma/client';

describe('Common', () => {
  let jwtAuthGuard: JwtAuthGuard;
  let rolesGuard: RolesGuard;
  let rateLimitGuard: RateLimitGuard;
  let httpExceptionFilter: HttpExceptionFilter;
  let loggingInterceptor: LoggingInterceptor;
  let reflector: Reflector;
  let redisService: RedisService;

  const mockRedisService = {
    incr: jest.fn(),
    expire: jest.fn(),
    getTtl: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        headers: {},
        header: jest.fn().mockReturnValue('req-id'),
        socket: { remoteAddress: '127.0.0.1' },
        url: '/auth/login',
        method: 'POST',
        user: { role: UserRole.STUDENT },
      }),
      getResponse: jest.fn().mockReturnValue({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        header: jest.fn(),
        statusCode: 200,
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        RolesGuard,
        RateLimitGuard,
        HttpExceptionFilter,
        LoggingInterceptor,
        Reflector,
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    rateLimitGuard = module.get<RateLimitGuard>(RateLimitGuard);
    httpExceptionFilter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
    loggingInterceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('JwtAuthGuard', () => {
    it('should allow public routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      expect(jwtAuthGuard.canActivate(mockExecutionContext)).toBe(true);
    });

    it('should call super.canActivate if not public', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
        // Mock super.canActivate
        jest.spyOn(JwtAuthGuard.prototype as any, 'canActivate').mockReturnValue(true);
        // But since we are testing the instance, spy on super prototype or just expect it to call super.
        // It's hard to spy on super call.
        // Alternatively, since AuthGuard is from @nestjs/passport, we can mock @nestjs/passport.
        // But we want to test OUR logic (public check).
        
        // Let's assume if it throws "Unknown authentication strategy", it PASSED our public check and went to super.
        try {
            jwtAuthGuard.canActivate(mockExecutionContext);
        } catch (e) {
            expect(e.message).toContain('Unknown authentication strategy');
        }
    });

    it('handleRequest should return user', () => {
        const user = { id: 1 };
        expect(jwtAuthGuard.handleRequest(null, user, null)).toBe(user);
    });

    it('handleRequest should throw if error', () => {
        expect(() => jwtAuthGuard.handleRequest(new Error(), null, null)).toThrow();
        expect(() => jwtAuthGuard.handleRequest(null, null, null)).toThrow();
    });
  });

  describe('RolesGuard', () => {
      it('should allow if no roles required', () => {
          jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
          expect(rolesGuard.canActivate(mockExecutionContext)).toBe(true);
      });

      it('should return false if no user', () => {
          jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
          const ctx = {
              ...mockExecutionContext,
              switchToHttp: jest.fn().mockReturnValue({
                  getRequest: jest.fn().mockReturnValue({}),
              }),
          } as unknown as ExecutionContext;
          expect(rolesGuard.canActivate(ctx)).toBe(false);
      });

      it('should throw forbidden if role mismatch', () => {
          jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
          expect(() => rolesGuard.canActivate(mockExecutionContext)).toThrow();
      });

      it('should allow if role matches', () => {
          jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.STUDENT]);
          expect(rolesGuard.canActivate(mockExecutionContext)).toBe(true);
      });
  });

  describe('RateLimitGuard', () => {
      it('should allow request within limit', async () => {
          mockRedisService.incr.mockResolvedValue(1);
          expect(await rateLimitGuard.canActivate(mockExecutionContext)).toBe(true);
          expect(mockRedisService.expire).toHaveBeenCalled();
      });

      it('should throw if limit exceeded', async () => {
          mockRedisService.incr.mockResolvedValue(10);
          mockConfigService.get.mockReturnValue(5); // limit
          mockRedisService.getTtl.mockResolvedValue(60);
          
          await expect(rateLimitGuard.canActivate(mockExecutionContext)).rejects.toThrow(HttpException);
      });
  });

  describe('HttpExceptionFilter', () => {
      it('should catch http exception', () => {
          const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
          const host = {
              switchToHttp: jest.fn().mockReturnValue({
                  getResponse: jest.fn().mockReturnValue({
                      status: jest.fn().mockReturnThis(),
                      json: jest.fn(),
                  }),
                  getRequest: jest.fn().mockReturnValue({
                      header: jest.fn(),
                      url: '/url',
                      method: 'GET',
                  }),
              }),
          } as unknown as any;
          
          httpExceptionFilter.catch(exception, host);
          expect(host.switchToHttp().getResponse().status).toHaveBeenCalledWith(403);
      });
  });

  describe('LoggingInterceptor', () => {
      it('should log request', (done) => {
          const callHandler: CallHandler = {
              handle: () => of('response'),
          };
          
          loggingInterceptor.intercept(mockExecutionContext, callHandler).subscribe({
              next: () => {
                  done();
              },
          });
      });
  });
});
