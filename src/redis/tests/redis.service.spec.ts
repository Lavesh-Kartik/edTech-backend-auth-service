import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../redis.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('RedisService', () => {
  let service: RedisService;
  let redisClient: any;

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'redis.url') return 'redis://localhost:6379';
      if (key === 'redis.keyPrefix') return 'auth:';
      return null;
    }),
  };

  beforeEach(async () => {
    // Reset mock for ioredis
    (Redis as unknown as jest.Mock).mockClear();
    
    // Setup mock instance
    redisClient = {
      on: jest.fn(),
      disconnect: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
    };
    
    (Redis as unknown as jest.Mock).mockImplementation(() => redisClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('set', async () => {
    await service.set('key', 'val', 10);
    expect(redisClient.set).toHaveBeenCalledWith('key', 'val', 'EX', 10);
  });

  it('get', async () => {
    redisClient.get.mockResolvedValue('val');
    expect(await service.get('key')).toBe('val');
  });

  it('del', async () => {
    await service.del('key');
    expect(redisClient.del).toHaveBeenCalledWith('key');
  });

  it('exists', async () => {
    redisClient.exists.mockResolvedValue(1);
    expect(await service.exists('key')).toBe(true);
  });

  it('incr', async () => {
    redisClient.incr.mockResolvedValue(2);
    expect(await service.incr('key')).toBe(2);
  });

  it('expire', async () => {
    await service.expire('key', 10);
    expect(redisClient.expire).toHaveBeenCalledWith('key', 10);
  });

  it('getTtl', async () => {
    redisClient.ttl.mockResolvedValue(100);
    expect(await service.getTtl('key')).toBe(100);
  });

  it('setWithPrefix', async () => {
    await service.setWithPrefix('key', 'val', 10);
    expect(redisClient.set).toHaveBeenCalledWith('auth:key', 'val', 'EX', 10);
  });
});
