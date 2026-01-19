import { createMainClient } from './supabase/server';

/**
 * 現在のセッション（ログイン状態）を取得する
 */
export const getSession = async () => {
  const supabase = createMainClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('[Auth Error]:', error.message);
    return null;
  }
  return session;
};

/**
 * 管理者権限があるかチェックする（暫定版）
 */
export const isAdmin = async () => {
  const session = await getSession();
  if (!session) return false;
  
  // 今後は Main DB の profiles テーブル等で権限を判定する
  return !!session.user;
};