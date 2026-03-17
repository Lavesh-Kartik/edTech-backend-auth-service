import { LocalStrategy } from '../strategies/local.strategy';
import { AuthService } from '../auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });

  it('should return user if validated', async () => {
    const user = { id: '1' };
    mockAuthService.validateUser.mockResolvedValue(user);
    expect(await strategy.validate('e', 'p')).toEqual(user);
  });

  it('should throw if invalid', async () => {
    mockAuthService.validateUser.mockResolvedValue(null);
    await expect(strategy.validate('e', 'p')).rejects.toThrow(UnauthorizedException);
  });
});
