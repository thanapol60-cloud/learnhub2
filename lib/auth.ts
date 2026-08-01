import crypto from 'crypto'

export function hashPassword(password: string): string {
  return crypto
    .pbkdf2Sync(password, 'salt', 1000, 64, 'sha512')
    .toString('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  const hashPassword = crypto
    .pbkdf2Sync(password, 'salt', 1000, 64, 'sha512')
    .toString('hex')
  return hashPassword === hash
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
