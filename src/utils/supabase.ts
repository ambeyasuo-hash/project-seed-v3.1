import { createClient } from '@supabase/supabase-js';

const targetUrl = process.env.DB_TARGET_URL;
const serviceRoleKey = process.env.DB_SERVICE_ROLE_KEY; 
const manualUrl = process.env.MANUAL_DB_URL;
const manualKey = process.env.MANUAL_DB_KEY;

// サーバーサイド実行時の標準オプション
const supabaseOptions = {
  auth: {
    persistSession: false, // サーバーサイドではセッション維持を無効化
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

/**
 * Main DB (jngg...): ユーザー管理、暗号化された対話ログ、処方箋データ
 * service_roleキーを使用し、RLSをバイパスして確実にログを記録する
 */
export const supabaseMain = createClient(
  targetUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder-key',
  supabaseOptions
);

/**
 * Manual DB (pcxv...): スタッフ情報、シフト、マニュアル、業務知識
 * こちらは読み取り専用、または限定的な操作を想定
 */
export const supabaseManual = createClient(
  manualUrl || 'https://placeholder.supabase.co',
  manualKey || 'placeholder-key',
  supabaseOptions
);