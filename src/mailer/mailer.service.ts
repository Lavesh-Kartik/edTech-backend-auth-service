import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly configService: ConfigService) {
    sgMail.setApiKey(this.configService.get<string>('sendgrid.apiKey'));
  }

  async sendVerificationEmail(to: string, fullName: string, otp: string): Promise<void> {
    const templateId = this.configService.get<string>('sendgrid.templates.verifyEmail');
    const from = {
      email: this.configService.get<string>('sendgrid.fromEmail'),
      name: this.configService.get<string>('sendgrid.fromName'),
    };

    try {
      await sgMail.send({
        to,
        from,
        templateId,
        dynamicTemplateData: {
          full_name: fullName,
          otp_code: otp,
          expires_in_minutes: 10,
          platform_name: 'AI Teaching Platform',
        },
      });
      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}`, error);
    }
  }

  async sendPasswordResetEmail(to: string, fullName: string, otp: string): Promise<void> {
    const templateId = this.configService.get<string>('sendgrid.templates.resetPassword');
    const from = {
      email: this.configService.get<string>('sendgrid.fromEmail'),
      name: this.configService.get<string>('sendgrid.fromName'),
    };

    try {
      await sgMail.send({
        to,
        from,
        templateId,
        dynamicTemplateData: {
          full_name: fullName,
          otp_code: otp,
          expires_in_minutes: 10,
        },
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
    }
  }

  async sendWelcomeEmail(to: string, fullName: string): Promise<void> {
    const templateId = this.configService.get<string>('sendgrid.templates.welcome');
    const from = {
      email: this.configService.get<string>('sendgrid.fromEmail'),
      name: this.configService.get<string>('sendgrid.fromName'),
    };

    try {
      await sgMail.send({
        to,
        from,
        templateId,
        dynamicTemplateData: {
          full_name: fullName,
          platform_url: this.configService.get<string>('app.frontendUrl'),
        },
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}`, error);
    }
  }

  async sendPasswordChangedEmail(to: string, fullName: string, ip: string): Promise<void> {
    const templateId = this.configService.get<string>('sendgrid.templates.passwordChanged');
    const from = {
      email: this.configService.get<string>('sendgrid.fromEmail'),
      name: this.configService.get<string>('sendgrid.fromName'),
    };

    try {
      await sgMail.send({
        to,
        from,
        templateId,
        dynamicTemplateData: {
          full_name: fullName,
          timestamp: new Date().toISOString(),
          ip_address: ip,
        },
      });
      this.logger.log(`Password changed email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password changed email to ${to}`, error);
    }
  }
}
