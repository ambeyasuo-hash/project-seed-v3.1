import 'server-only';
// 修正1: Main DBクライアントから Manual DBクライアントに変更
import { createManualClient } from '@/lib/supabase/server';
// 修正2: Manual DBの型定義をインポート
import { Tables as TablesManual } from '@/types/database_manual';

// 修正3: Manual DBの型定義から Staff 型を正確に定義
export type Staff = Pick<
    TablesManual<'staff'>, // <--- TablesManual<'staff'>に変更
    'id' | 'line_id' | 'display_name' | 'created_at' | 'employment_type'
>;

/**
 * 全スタッフ情報を Manual DB から取得するサーバーアクション
 * @returns {Promise<{ staff: Staff[] } | { error: string }>} 
 */
export async function getAllStaff() {
    try {
        // Dual-Core DB分離原則に従い、専用クライアントを使用
        // 修正4: Manual DBクライアントを使用
        const supabase = createManualClient();

        // エラーメッセージの型定義に基づいて、存在しない role, updated_at を削除し、employment_type を追加する
        // 修正5: select句は変更なし（型エラーは修正3と修正4で解消される）
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