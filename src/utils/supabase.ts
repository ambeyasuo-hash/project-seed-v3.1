import { createClient } from '@supabase/supabase-js';

const mainUrl = process.env.DB_MAIN_URL;
const mainKey = process.env.DB_MAIN_SERVICE_ROLE_KEY;
const manualUrl = process.env.DB_MANUAL_URL;
const manualKey = process.env.DB_MANUAL_SERVICE_ROLE_KEY;

// ビルドエラー回避：値がない場合はダミーを入れ、実行時にエラーを出す構成
export const supabaseMain = createClient(
  mainUrl || 'https://placeholder-url.supabase.co',
  mainKey || 'placeholder-key'
);

export const supabaseManual = createClient(
  manualUrl || 'https://placeholder-url.supabase.co',
  manualKey || 'placeholder-key'
);