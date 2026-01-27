// src/app/staff/actions.ts
'use server'

import { createManualClient } from '@/lib/db/server'
import { Database } from '@/types/database'

// 戻り値の型定義
type StaffResult = { success: true, staff: Database['public']['Tables']['staff']['Row'] } | { error: string }

/**
 * LINE ID (liff_user_id) を基に、Manual DB からスタッフ情報を取得する。
 * @param liffUserId LIFF から取得した LINE のユーザー ID
 * @returns 成功時はスタッフ情報、失敗時はエラーメッセージ
 */
export async function getStaffByLineId(liffUserId: string): Promise<StaffResult> {
  if (!liffUserId) {
    return { error: 'LINE User ID is required.' }
  }

  // Manual DB のクライアントを作成 (Phase 4担当者の回答に基づき引数なし)
  const supabase = createManualClient() 

  // staff テーブルから line_id が一致するスタッフを検索
  const { data, error } = await supabase
    .from('staff_data')
    .select('*')
    .eq('line_id', liffUserId)
    .single()

  if (error) {
    console.error('Error fetching staff by LINE ID:', error)
    // RLS エラーの可能性があるため、一般的なエラーメッセージを返す
    return { error: 'Staff information could not be retrieved. Check RLS policy.' }
  }

  if (!data) {
    return { error: 'No staff found with the provided LINE ID.' }
  }

  return { success: true, staff: data }
}