import { createClient } from '@supabase/supabase-js';

// Vercel上の環境変数名に完全一致させて取得
const targetUrl = process.env.DB_TARGET_URL;
const targetKey = process.env.DB_TARGET_KEY;
const manualUrl = process.env.MANUAL_DB_URL;
const manualKey = process.env.MANUAL_DB_KEY;

/**
 * Main DB (jngg...): ユーザー管理、暗号化された対話ログ、処方箋データ
 * ビルド時のエラー回避のため、未定義時はプレースホルダーを使用
 */
export const supabaseMain = createClient(
  targetUrl || 'https://placeholder.supabase.co',
  targetKey || 'placeholder-key'
);

/**
 * Manual DB (pcxv...): スタッフ情報、シフト、マニュアル、業務知識
 */
export const supabaseManual = createClient(
  manualUrl || 'https://placeholder.supabase.co',
  manualKey || 'placeholder-key'
);