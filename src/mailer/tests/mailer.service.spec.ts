import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '../mailer.service';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

describe('MailerService', () => {
  let service: MailerService;

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'sendgrid.apiKey') return 'key';
      if (key === 'sendgrid.fromEmail') return 'from@test.com';
      if (key === 'sendgrid.fromName') return 'From Name';
      if (key.includes('templates')) return 'template-id';
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sendVerificationEmail', async () => {
    (sgMail.send as jest.Mock).mockResolvedValue([{}, {}]);
    await service.sendVerificationEmail('to@test.com', 'Name', '123456');
    expect(sgMail.send).toHaveBeenCalled();
  });

  it('sendVerificationEmail error', async () => {
    (sgMail.send as jest.Mock).mockRejectedValue(new Error('fail'));
    await service.sendVerificationEmail('to@test.com', 'Name', '123456');
    // Should log error but not throw
  });

  it('sendPasswordResetEmail', async () => {
    await service.sendPasswordResetEmail('to@test.com', 'Name', '123456');
    expect(sgMail.send).toHaveBeenCalled();
  });

  it('sendWelcomeEmail', async () => {
    await service.sendWelcomeEmail('to@test.com', 'Name');
    expect(sgMail.send).toHaveBeenCalled();
  });

  it('sendPasswordChangedEmail', async () => {
    await service.sendPasswordChangedEmail('to@test.com', 'Name', '1.1.1.1');
    expect(sgMail.send).toHaveBeenCalled();
  });
});
