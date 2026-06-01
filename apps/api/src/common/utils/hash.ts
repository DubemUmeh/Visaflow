import { createHash, randomBytes } from 'crypto';

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function generateOtpCode(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  const randomBuffer = randomBytes(length);
  for (const byte of randomBuffer) {
    otp += digits.charAt(byte % digits.length);
  }
  return otp;
}
