// src/app/staff/shift/actions.ts
'use server'

import { createManualClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { cookies } from 'next/headers'

// フォームデータ型
type ShiftRequestInsert = Database['public']['Tables']['shift_requests']['Insert']
// 戻り値の型定義
type SubmitResult = { success: true } | { error: string }

/**
 * シフト希望を Manual DB の shift_requests テーブルに登録する
 * @param payload フォームデータ
 * @returns 成功またはエラーメッセージ
 */
export async function submitShiftRequest(payload: ShiftRequestInsert): Promise<SubmitResult> {
  // Manual DB のクライアントを作成 (Service Role Key接続)
  const supabase = createManualClient()

  // Supabase Type Bypass: payload の型推論エラーを回避
  const { error } = await supabase
    .from('shift_requests')
    .insert(payload as any)
    .select()

  if (error) {
    console.error('Error submitting shift request:', error)
    return { error: `シフト申請に失敗しました: ${error.message}` }
  }

  return { success: true }
}