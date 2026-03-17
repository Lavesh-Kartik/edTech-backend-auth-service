import { hashToken, generateRandomToken, compareTimingSafe } from '../utils/crypto.util';
import { generateOtpCode } from '../utils/otp.util';
import * as crypto from 'crypto';

describe('Utils', () => {
    describe('CryptoUtil', () => {
        it('hashToken should return sha256 hash', () => {
            const token = 'token';
            const hash = hashToken(token);
            expect(hash).toBeDefined();
            expect(hash).not.toBe(token);
        });

        it('generateRandomToken should return hex string', () => {
            const token = generateRandomToken();
            expect(token).toBeDefined();
            expect(token.length).toBeGreaterThan(0);
        });

        it('compareTimingSafe should return true for equal strings', () => {
            expect(compareTimingSafe('a', 'a')).toBe(true);
        });

  it('compareTimingSafe should return false if error', () => {
      // @ts-ignore
      expect(compareTimingSafe(null, 'b')).toBe(false);
  });
    });

    describe('OtpUtil', () => {
        it('generateOtpCode should return 6 digit string', () => {
            const otp = generateOtpCode();
            expect(otp).toHaveLength(6);
            expect(Number(otp)).not.toBeNaN();
        });

        it('generateOtpCode should throw if length not 6', () => {
            expect(() => generateOtpCode(5)).toThrow();
        });
    });
});
