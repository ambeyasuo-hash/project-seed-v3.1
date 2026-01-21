import 'server-only';
import { createMainClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';

// 実際に select するカラムのみを Pick で抽出した Staff 型を定義する
export type Staff = Pick<
    Database['public']['Tables']['staff']['Row'],
    'id' | 'line_id' | 'display_name' | 'created_at' | 'employment_type'
>;

/**
 * 全スタッフ情報を Main DB から取得するサーバーアクション
 * @returns {Promise<{ staff: Staff[] } | { error: string }>} 
 */
export async function getAllStaff() {
    try {
        // Dual-Core DB分離原則に従い、専用クライアントを使用
        const supabase = createMainClient();

        // エラーメッセージの型定義に基づいて、存在しない role, updated_at を削除し、employment_type を追加する
        const { data: staff, error } = await supabase
            .from('staff')
            .select(`
                id,
                line_id,
                display_name,
                employment_type,
                created_at
            `);
        
        if (error) {
            console.error('Error fetching all staff:', error.message);
            return { error: 'スタッフ情報の取得に失敗しました。' };
        }

        // data を Staff[] 型にキャストする（select句で絞っているので、互換性の問題は解消されるはず）
        return { staff: staff as Staff[] ?? [] };

    } catch (e) {
        console.error('Unexpected error in getAllStaff:', e);
        return { error: '予期せぬエラーが発生しました。' };
    }
}