// src/app/admin/actions.ts
'use server';

import { verifyAdmin } from "@/lib/auth/admin";
import { createManualClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

type Staff = Database['public']['Tables']['staff']['Row'];
type StaffList = Staff[];

type StaffResult = { 
  success: true, 
  staffs: StaffList 
} | { 
  success: false, 
  error: 'AUTH_ERROR' | 'DB_ERROR', 
  message: string 
};

/**
 * 管理者権限でManual DBから全スタッフ名簿を取得する。
 */
export async function getAllStaffs(): Promise<StaffResult> {
  // 1. 管理者認証
  const authResult = await verifyAdmin();

  if (!authResult.success) {
    // verifyAdminのエラーをそのまま返す
    return { success: false, error: 'AUTH_ERROR', message: authResult.message };
  }

  // 2. Manual DBクライアントの作成
  const supabase = createManualClient();

  // 3. 全スタッフ名簿の取得
  const { data: staffs, error: dbError } = await supabase
    .from('staff')
    .select('id, display_name, employment_type, is_admin, created_at, line_id'); // 必要なカラムを選択

  if (dbError) {
    console.error("Staff fetch error:", dbError);
    return { success: false, error: 'DB_ERROR', message: 'スタッフ名簿の取得中にエラーが発生しました。' };
  }

  return { success: true, staffs: staffs as StaffList };
}