import { createManualClient } from '../supabase/server';

/**
 * AI専用ビュー（ai_staff_context）からデータを取得する
 * 実名などの個人情報はビュー側で除外されている
 */
export const getAiStaffContext = async () => {
  // 第二引数を true にし、ai_copilot_reader ロールとして接続
  const supabase = createManualClient('ai_copilot_reader'); // <--- 修正: true から 'ai_copilot_reader' へ
  
  const { data, error } = await supabase
    .from('ai_staff_context')
    .select('*');

  if (error) {
    console.error('[AI Context Error]:', error.message);
    throw error;
  }

  return data;
};