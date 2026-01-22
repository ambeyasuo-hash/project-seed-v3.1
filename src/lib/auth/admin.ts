// src/lib/auth/admin.ts
import { createManualClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

// Selectの戻り値の型を明示的に定義（is_adminが型定義に反映済み前提）
type AdminStaff = { id: string, is_admin: boolean | null, display_name: string };

type AdminAuthResult = { 
  success: true, 
  staff: AdminStaff 
} | { 
  success: false, 
  error: 'UNAUTHENTICATED' | 'NOT_ADMIN' | 'NOT_FOUND' | 'DB_ERROR', 
  message: string 
};

/**
 * サーバー側で管理者権限を確認する関数。
 * @returns {AdminAuthResult} 管理者認証の結果
 */
export async function verifyAdmin(): Promise<AdminAuthResult> {
  const supabase = createManualClient(); 

  // 1. セッション（認証）の確認
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return { success: false, error: 'UNAUTHENTICATED', message: 'ログインしていません。' };
  }

  // 2. staffレコードの取得と管理者フラグの確認
  const { data: staff, error: dbError } = await supabase
    .from('staff')
    .select('id, is_admin, display_name')
    .eq('id', user.id) 
    .maybeSingle();

  if (dbError) {
    console.error("DB Error:", dbError.message);
    return { success: false, error: 'DB_ERROR', message: 'DBエラーが発生しました。' };
  }
  
  if (!staff) {
    return { success: false, error: 'NOT_FOUND', message: 'スタッフ情報が見つかりません。' };
  }
  
  const adminStaff = staff as AdminStaff; // 明示的な型アサーション

  if (!adminStaff.is_admin) {
    return { success: false, error: 'NOT_ADMIN', message: '管理者権限がありません。' };
  }

  return { success: true, staff: adminStaff };
}