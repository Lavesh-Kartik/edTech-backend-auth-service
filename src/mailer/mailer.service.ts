import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor(private readonly configService: ConfigService) {}

  private async sendEmail(payload: any): Promise<void> {
    const apiKey = this.configService.get<string>('brevo.apiKey');
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Brevo API Error: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async sendVerificationEmail(to: string, fullName: string, otp: string): Promise<void> {
    const templateId = this.configService.get<number>('brevo.templates.verifyEmail');
    const payload = {
      templateId,
      to: [{ email: to, name: fullName }],
      sender: {
        email: this.configService.get<string>('brevo.fromEmail'),
        name: this.configService.get<string>('brevo.fromName'),
      },
      params: {
        full_name: fullName,
        otp_code: otp,
        expires_in_minutes: 10,
        platform_name: 'AI Teaching Platform',
      },
    };

    try {
      await this.sendEmail(payload);
      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}`, error);
    }
  }

  async sendPasswordResetEmail(to: string, fullName: string, otp: string): Promise<void> {
    const templateId = this.configService.get<number>('brevo.templates.resetPassword');
    const payload = {
      templateId,
      to: [{ email: to, name: fullName }],
      sender: {
        email: this.configService.get<string>('brevo.fromEmail'),
        name: this.configService.get<string>('brevo.fromName'),
      },
      params: {
        full_name: fullName,
        otp_code: otp,
        expires_in_minutes: 10,
      },
    };

    try {
      await this.sendEmail(payload);
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
    }
  }

  async sendWelcomeEmail(to: string, fullName: string): Promise<void> {
    const templateId = this.configService.get<number>('brevo.templates.welcome');
    const payload = {
      templateId,
      to: [{ email: to, name: fullName }],
      sender: {
        email: this.configService.get<string>('brevo.fromEmail'),
        name: this.configService.get<string>('brevo.fromName'),
      },
      params: {
        full_name: fullName,
        platform_url: this.configService.get<string>('app.frontendUrl'),
      },
    };

    try {
      await this.sendEmail(payload);
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}`, error);
    }
  }

  async sendPasswordChangedEmail(to: string, fullName: string, ip: string): Promise<void> {
    const templateId = this.configService.get<number>('brevo.templates.passwordChanged');
    const payload = {
      templateId,
      to: [{ email: to, name: fullName }],
      sender: {
        email: this.configService.get<string>('brevo.fromEmail'),
        name: this.configService.get<string>('brevo.fromName'),
      },
      params: {
        full_name: fullName,
        timestamp: new Date().toISOString(),
        ip_address: ip,
      },
    };

    try {
      await this.sendEmail(payload);
      this.logger.log(`Password changed email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password changed email to ${to}`, error);
    }
  }
}
