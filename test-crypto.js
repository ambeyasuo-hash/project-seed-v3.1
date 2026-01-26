const crypto = require('crypto');
const algorithm = 'aes-256-gcm';
const key = Buffer.from('2c07beac537e0f2d2641ca4a86449e2e'); // .envと同じもの
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update('最近、少し仕事が忙しくて疲れています。', 'utf8', 'hex');
encrypted += cipher.final('hex');
const tag = cipher.getAuthTag().toString('hex');
console.log(`${iv.toString('hex')}:${tag}:${encrypted}`);