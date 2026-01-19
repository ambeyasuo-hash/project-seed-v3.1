import { createClient } from '@supabase/supabase-js';

export const createManualClient = (useAiRole = false) => {
  // あなたの .env.local にある正確な変数名を使用します
  const url = process.env.MANUAL_DB_URL!;
  const key = useAiRole 
    ? process.env.SERVICE_ROLE_KEY! 
    : process.env.MANUAL_DB_KEY!;

  return createClient(url, key, {
    global: useAiRole ? { headers: { 'x-supabase-role': 'ai_copilot_reader' } } : {}
  });
};