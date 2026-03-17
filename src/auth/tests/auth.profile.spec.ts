import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { User } from '@prisma/client';

describe('AuthModule - Profile', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    updateProfile: jest.fn(),
  };

  const mockRedisService = {};
  const mockConfigService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('getProfile', () => {
    it('should return user profile without passwordHash', async () => {
      const user = { id: '1', email: 'e', passwordHash: 'hash', fullName: 'name' } as User;
      const result = await controller.getProfile(user);
      expect(result).toEqual({ id: '1', email: 'e', fullName: 'name' });
      expect((result as any).passwordHash).toBeUndefined();
    });
  });

  describe('updateProfile', () => {
    it('should update profile', async () => {
      const dto: UpdateProfileDto = { fullName: 'New Name' };
      const updatedUser = { id: '1', fullName: 'New Name' };
      mockAuthService.updateProfile.mockResolvedValue(updatedUser);
      
      const result = await controller.updateProfile('1', dto);
      expect(result).toEqual(updatedUser);
      expect(mockAuthService.updateProfile).toHaveBeenCalledWith('1', dto);
    });
  });
});
