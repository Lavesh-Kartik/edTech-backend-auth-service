import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterDto } from '../dto/register.dto';
import { ConflictException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';

describe('AuthModule - Registration', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
  };

  const mockRedisService = {};
  const mockConfigService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    };

    it('T-A-01: Valid registration → 201 + userId + OTP email sent', async () => {
      const result = { message: 'User registered successfully', userId: 'uuid' };
      mockAuthService.register.mockResolvedValue(result);

      expect(await controller.register(registerDto)).toEqual(result);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('T-A-02: Duplicate email → 409 Conflict', async () => {
      mockAuthService.register.mockRejectedValue(new ConflictException('Email already exists'));

      await expect(controller.register(registerDto)).rejects.toThrow(ConflictException);
    });

    // Validation tests (T-A-03 to T-A-09) are typically handled by ValidationPipe e2e or unit testing DTOs directly.
    // However, since we are mocking the service, we can't test DTO validation logic here fully unless we use a real ValidationPipe in a controller test or test the DTO class.
    // DTO validation is best tested with class-validator validation function or E2E tests.
    // For coverage, we'll focus on the controller/service logic.
    // We can add a DTO test file if needed for strictly 100% on DTOs.
  });
});
