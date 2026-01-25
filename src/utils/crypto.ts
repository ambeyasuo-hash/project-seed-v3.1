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

/**
 * AES-256-GCMで暗号化されたデータ (IV:TAG:ENCRYPTED_DATA) を復号する。
 * 暗号化キーは環境変数から取得するため、引数は暗号化テキストのみ。
 */
export function decrypt(encryptedText: string): string {
  // IV:TAG:ENCRYPTED_DATA の形式を分割
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format.');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}