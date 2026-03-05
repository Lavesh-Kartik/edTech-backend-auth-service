import { registerAs } from '@nestjs/config';

export default registerAs('sendgrid', () => ({
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.SENDGRID_FROM_EMAIL,
  fromName: process.env.SENDGRID_FROM_NAME,
  templates: {
    verifyEmail: process.env.SENDGRID_TEMPLATE_VERIFY,
    resetPassword: process.env.SENDGRID_TEMPLATE_RESET,
    welcome: process.env.SENDGRID_TEMPLATE_WELCOME,
    passwordChanged: process.env.SENDGRID_TEMPLATE_PWD_CHANGED,
  },
}));
