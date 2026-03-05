import * as crypto from 'crypto';

export function generateOtpCode(length = 6): string {
  if (length !== 6) {
    throw new Error('OTP length must be 6');
  }
  return crypto.randomInt(100000, 999999).toString();
}
