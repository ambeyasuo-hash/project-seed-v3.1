import { createClient } from '@supabase/supabase-js';

// Main DB (jngg...): ユーザー管理・暗号化ログ
export const supabaseMain = createClient(
  process.env.DB_MAIN_URL!,
  process.env.DB_MAIN_SERVICE_ROLE_KEY!
);

// Manual DB (pcxv...): シフト・マニュアル・スタッフ情報
export const supabaseManual = createClient(
  process.env.DB_MANUAL_URL!,
  process.env.DB_MANUAL_SERVICE_ROLE_KEY!
);