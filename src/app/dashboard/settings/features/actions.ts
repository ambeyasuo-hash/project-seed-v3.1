'use server';

import { createMainClient } from '../../../lib/supabase/server';
// 仮のテナントID（page.tsxと同期）
const HARDCODED_TENANT_ID = 'db86e974-90a4-471a-b0f3-94c0429f635c';

/**
 * 特定のテナントIDの機能フラグの状態を更新するServer Action。
 * @param featureKey 更新対象の機能キー
 * @param isEnabled 設定する状態 (true: ON, false: OFF)
 * @returns 成功またはエラーメッセージ
 */
export async function updateFeatureFlag(
  featureKey: string,
  isEnabled: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createMainClient();
    
    // 1. 現在の tenant_flags を取得
    const { data: tenantData, error: fetchError } = await supabase
      .from('tenants')
      .select('tenant_flags')
      .eq('id', HARDCODED_TENANT_ID)
      .single();

    if (fetchError) {
      console.error('Error fetching tenant flags:', fetchError);
      return { success: false, message: '現在の設定の取得に失敗しました。' };
    }

    // 2. 既存のフラグを読み込み、新しい状態を適用
    const currentFlags = (tenantData?.tenant_flags || {}) as Record<string, boolean>;
    const updatedFlags = {
      ...currentFlags,
      [featureKey]: isEnabled,
    };
    
    // 3. 更新されたフラグをDBに書き戻す
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ tenant_flags: updatedFlags })
      .eq('id', HARDCODED_TENANT_ID);

    if (updateError) {
      console.error('Error updating feature flag:', updateError);
      return { success: false, message: '設定の更新に失敗しました。' };
    }

    // 成功
    const state = isEnabled ? 'ON' : 'OFF';
    return { success: true, message: `機能「${featureKey}」を ${state} に設定しました。` };

  } catch (e) {
    const error = e as Error;
    console.error('Unexpected error in updateFeatureFlag:', error.message);
    return { success: false, message: '予期せぬエラーが発生しました。' };
  }
}