// src/lib/db/manual.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database'; // 厳格な型適用

// 環境変数からManual DBの情報を取得
const manualDbUrl = process.env.MANUAL_DB_URL;
const manualDbKey = process.env.MANUAL_DB_SERVICE_ROLE_KEY; // または ANON_KEY

if (!manualDbUrl || !manualDbKey) {
  // 開発プロトコルに従い、設定エラーを明確にする
  throw new Error('Missing MANUAL_DB_URL or MANUAL_DB_SERVICE_ROLE_KEY environment variables for Manual DB.');
}

/**
 * Manual DB (SHIFT) に接続するための専用クライアントを生成する
 * 全ての操作はこのクライアントを経由する必要がある (The Iron Rule: Dual-Core DBの分離)
 * @returns SupabaseClient<Database>
 */
export const createManualClient = () => {
  // 型定義を適用し、Manual DBクライアントを生成
  // NEXT_PUBLIC_SUPABASE_ANON_KEY などの代わりに、Manual DB専用のキーを使用
  // 本番環境ではセキュリティを考慮し、サーバーサイドでのみ使用する
  return createClient<Database>(
    manualDbUrl,
    manualDbKey,
    {
      auth: {
        persistSession: false, // Next.js App Routerでのセッション永続化を無効化
      }
    }
  );
};

// Next.jsの環境では、通常 createManualClient() を呼び出して使用する