import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY!; // 32文字のキー
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  // IV:TAG:ENCRYPTED_DATA の形式で保存
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}