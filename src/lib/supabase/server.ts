import { createClient } from '@supabase/supabase-js';

// メインDB（SEED/ログ用）接続
export const createMainClient = () => {
  return createClient(
    process.env.DB_TARGET_URL!,
    process.env.DB_TARGET_KEY!
  );
};

// マニュアル・シフトDB接続（管理者/AIロール）
export const createManualClient = (useAiRole = false) => {
  const url = process.env.MANUAL_DB_URL!;
  const key = useAiRole 
    ? process.env.SERVICE_ROLE_KEY! 
    : process.env.MANUAL_DB_KEY!;

  return createClient(url, key, {
    global: useAiRole ? { headers: { 'x-supabase-role': 'ai_copilot_reader' } } : {}
  });
};