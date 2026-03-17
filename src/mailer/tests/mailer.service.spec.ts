import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '../mailer.service';
import { ConfigService } from '@nestjs/config';

describe('MailerService', () => {
  let service: MailerService;

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'brevo.apiKey') return 'key';
      if (key === 'brevo.fromEmail') return 'from@test.com';
      if (key === 'brevo.fromName') return 'From Name';
      if (key.includes('templates')) return 1;
      if (key === 'app.frontendUrl') return 'http://front';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);

    // Mock global fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sendVerificationEmail', async () => {
    await service.sendVerificationEmail('to@test.com', 'Name', '123456');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('sendVerificationEmail error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue('Bad Request'),
    });
    await service.sendVerificationEmail('to@test.com', 'Name', '123456');
    // Should log error but not throw unhandled exception (caught internally)
    expect(global.fetch).toHaveBeenCalled();
  });

  it('sendPasswordResetEmail', async () => {
    await service.sendPasswordResetEmail('to@test.com', 'Name', '123456');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('sendWelcomeEmail', async () => {
    await service.sendWelcomeEmail('to@test.com', 'Name');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('sendPasswordChangedEmail', async () => {
    await service.sendPasswordChangedEmail('to@test.com', 'Name', '1.1.1.1');
    expect(global.fetch).toHaveBeenCalled();
  });
});
