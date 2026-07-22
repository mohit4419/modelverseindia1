import crypto from 'crypto';

/**
 * Generate random cryptographic salt
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Securely hash password using SHA-256 with the generated salt (legacy auth support)
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}
