// src/lib/auth/admin.ts の完全なコード (最終版)
import { createManualClient } from "@/lib/db/server";
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
  console.log("DEBUG: verifyAdmin - Client created."); 

  // 1. セッション（認証）の確認
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !user) {
    console.log("DEBUG: verifyAdmin - UNAUTHENTICATED or Session Error:", sessionError?.message || 'No user');
    return { success: false, error: 'UNAUTHENTICATED', message: 'ログインしていません。' };
  }
  
  // 2. staffレコードの取得と管理者フラグの確認
  console.log("DEBUG: verifyAdmin - Attempting to fetch staff for user:", user.id); 

  const { data: staff, error: dbError } = await supabase
    .from('staff_data')
    .select('id, is_admin, display_name')
    .eq('id', user.id) 
    .maybeSingle();

  if (dbError) {
    console.error("DB Error:", dbError.message);
    return { success: false, error: 'DB_ERROR', message: 'DBエラーが発生しました。' };
  }
  
  if (!staff) {
    console.log("DEBUG: verifyAdmin - Staff not found in Manual DB.");
    return { success: false, error: 'NOT_FOUND', message: 'スタッフ情報が見つかりません。' };
  }
  
  const adminStaff = staff as AdminStaff; 

  if (!adminStaff.is_admin) {
    console.log("DEBUG: verifyAdmin - User found, but NOT ADMIN.");
    return { success: false, error: 'NOT_ADMIN', message: '管理者権限がありません。' };
  }

  console.log("DEBUG: verifyAdmin - AUTH SUCCESS.");
  return { success: true, staff: adminStaff };
}