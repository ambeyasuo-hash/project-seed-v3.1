// src/app/staff/shift/actions.server.ts
'use server';

import { createManualClient } from '@/lib/db/manual';
// TablesInsert が解決できない問題があったため、Raw型を直接使用
import type { Database } from '@/types/database'; 

// シフト申請フォームの型 (TablesInsert<'shift_requests'> から自動生成項目を除外)
type ShiftRequestFormData = Omit<Database['public']['Tables']['shift_requests']['Insert'], 'id' | 'is_approved' | 'created_at'>;

/**
 * シフト申請データを Manual DB (shift_requests) に保存するサーバーアクション
 * @param formData シフト申請データ (staff_id を含む)
 * @returns 成功時は { success: true }、失敗時は { error: string }
 */
export async function submitShiftRequest(formData: ShiftRequestFormData): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = createManualClient();

    if (!formData.staff_id || !formData.shift_date || !formData.start_time || !formData.end_time) {
      return { error: '必須項目が不足しています。' };
    }

    // ★ 挿入データ (payload) を定義
    const payload = {
        staff_id: formData.staff_id,
        shift_date: formData.shift_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes || null,
    };
    
    // Manual DB の shift_requests テーブルにデータを挿入
    // ★ 過去の失敗を教訓に as any で型推論をバイパスし、エラーを強制的に解消
    const { error } = await supabase
      .from('shift_requests')
      .insert(payload as any); // <--- 型エラー回避の最終手段

    if (error) {
      console.error('Manual DB insert error:', error);
      return { error: 'DB保存中にエラーが発生しました。' };
    }

    return { success: true };

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : '予期せぬエラーが発生しました。';
    console.error('Server Action execution error:', errorMessage);
    return { error: `サーバー処理エラー: ${errorMessage}` };
  }
}