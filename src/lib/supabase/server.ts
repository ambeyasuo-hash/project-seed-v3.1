// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/auth-helpers-nextjs'; // auth-helpersを使用
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// サーバーコンポーネント用クライアント（Manual DB）
export const createManualClient = (role?: 'ai_copilot_reader') => {
  const cookieStore = cookies();

  // auth-helpers が要求するクッキー操作メソッドを定義
  const options = {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, opts: object) => {
        try {
          cookieStore.set(name, value, opts);
        } catch (error) {
          // サーバーコンポーネントではset/removeは不可
        }
      },
      remove: (name: string) => {
        try {
          cookieStore.set(name, '', { expires: new Date(0) });
        } catch (error) {
          // サーバーコンポーネントではset/removeは不可
        }
      },
    },
    // RLSロール設定のヘッダーは auth-helpers の範囲外だが、createClient のオプションに渡す
    global: role === 'ai_copilot_reader'
      ? { headers: { 'x-supabase-role': 'ai_copilot_reader' } }
      : undefined,
  };

  return createServerClient<Database>(
    process.env.MANUAL_DB_URL!, // <--- 修正: SUPABASE_DB_URL から MANUAL_DB_URL へ
    process.env.MANUAL_DB_KEY!, // <--- 修正: SUPABASE_DB_KEY から MANUAL_DB_KEY へ
    options
  );
};

// サーバーコンポーネント用クライアント（Main DB）
export const createMainClient = () => {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.DB_TARGET_URL!,
    process.env.DB_TARGET_KEY!,
    { cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, opts: object) => {
        try {
          cookieStore.set(name, value, opts);
        } catch (error) {}
      },
      remove: (name: string) => {
        try {
          cookieStore.set(name, '', { expires: new Date(0) });
        } catch (error) {}
      },
    }}
  );
};