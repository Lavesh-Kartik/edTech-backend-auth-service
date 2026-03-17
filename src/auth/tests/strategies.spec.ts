import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from '../strategies/google.strategy';
import { GithubStrategy } from '../strategies/github.strategy';
import { ConfigService } from '@nestjs/config';

describe('OAuth Strategies', () => {
  let googleStrategy: GoogleStrategy;
  let githubStrategy: GithubStrategy;

  const mockConfigService = {
    get: jest.fn((key) => {
        if (key.includes('google')) return 'google-val';
        if (key.includes('github')) return 'github-val';
        return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        GithubStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    googleStrategy = module.get<GoogleStrategy>(GoogleStrategy);
    githubStrategy = module.get<GithubStrategy>(GithubStrategy);
  });

  describe('GoogleStrategy', () => {
      it('should validate and return profile', async () => {
          const profile = {
              id: '123',
              displayName: 'Name',
              emails: [{ value: 'test@email.com' }],
              photos: [{ value: 'url' }],
          };
          
          const done = jest.fn();
          await googleStrategy.validate('at', 'rt', profile, done);
          
          expect(done).toHaveBeenCalledWith(null, {
              id: '123',
              email: 'test@email.com',
              displayName: 'Name',
              avatarUrl: 'url',
              provider: 'google',
          });
      });
  });

  describe('GithubStrategy', () => {
      it('should validate and return profile', async () => {
          const profile = {
              id: '123',
              username: 'user',
              emails: [{ value: 'test@email.com' }],
              photos: [{ value: 'url' }],
          };
          
          const done = jest.fn();
          await githubStrategy.validate('at', 'rt', profile, done);
          
          expect(done).toHaveBeenCalledWith(null, {
              id: '123',
              email: 'test@email.com',
              displayName: 'user',
              avatarUrl: 'url',
              provider: 'github',
          });
      });
  });
});
