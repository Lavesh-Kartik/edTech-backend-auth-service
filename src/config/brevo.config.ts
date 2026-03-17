import { registerAs } from '@nestjs/config';

export default registerAs('brevo', () => ({
  apiKey: process.env.BREVO_API_KEY,
  fromEmail: process.env.BREVO_FROM_EMAIL,
  fromName: process.env.BREVO_FROM_NAME,
  templates: {
    verifyEmail: parseInt(process.env.BREVO_TEMPLATE_VERIFY, 10),
    resetPassword: parseInt(process.env.BREVO_TEMPLATE_RESET, 10),
    welcome: parseInt(process.env.BREVO_TEMPLATE_WELCOME, 10),
    passwordChanged: parseInt(process.env.BREVO_TEMPLATE_PWD_CHANGED, 10),
  },
}));
