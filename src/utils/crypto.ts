// src/utils/crypto.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * LINE_CHANNEL_SECRET をシードにして 32バイトの暗号化鍵を生成する
 */
const getEncryptionKey = (): Buffer => {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) {
    throw new Error('LINE_CHANNEL_SECRET is not set in environment variables.');
  }
  // シークレットの長さに関わらず、ハッシュ化により32バイトの鍵を導出（AES-256用）
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * 文字列を暗号化し、IV:TAG:DATA 形式の文字列を返す
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // GCM推奨の12バイト
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  
  // IV:TAG:ENCRYPTED_DATA の形式で保存（復号時に分割利用）
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * 暗号化文字列（IV:TAG:DATA）を復号する
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format.');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}