import { isFeatureEnabled } from './features';
import { TECHNICAL_CONSTANTS } from './constants';
import { supabaseManual } from '@/utils/supabase'; // 修正: インスタンスを直接インポート

type FeatureKey = keyof typeof TECHNICAL_CONSTANTS.FEATURES;

/**
 * プロキシ・ゲートウェイ (既存)
 * 全ての主要な機能実行はこの関数を経由し、機能フラグの検証を受ける
 */
export const gatewayProxy = async <T>(
  featureKey: FeatureKey,
  action: () => Promise<T>
): Promise<T> => {
  // 1. 機能フラグの確認
  if (!isFeatureEnabled(featureKey)) {
    throw new Error(`機能「${featureKey}」は現在無効化されています。`);
  }

  // 2. アクションの実行
  try {
    return await action();
  } catch (error) {
    console.error(`[Proxy Gateway Error] ${featureKey}:`, error);
    throw error;
  }
};

// --- 店舗設定基盤 (Phase 6.1) 用の追加ロジック ---

export type StorePolicy = {
  tenant_id: string;
  shift_cycle: 'weekly' | 'bi_weekly' | 'monthly';
  salary_closing_day: number;
  shift_start_day: number;
  target_labor_cost_rate: number;
  target_sales_daily: number;
  sanctuary_params: any;
  labor_law_config: {
    max_working_days_consecutive: number;
    min_interval_hours: number;
    break_rules: Array<{ threshold_hours: number; break_minutes: number }>;
  };
  thx_mileage_settings: any;
};

/**
 * 店舗設定を取得する
 */
export async function getStorePolicy(tenantId: string): Promise<StorePolicy | null> {
  // supabaseManual を使用
  const { data, error } = await supabaseManual
    .from('store_policies')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    console.error('Error fetching store policy:', error);
    return null;
  }
  return data as StorePolicy;
}

/**
 * 店舗設定を更新（または新規作成）する
 */
export async function upsertStorePolicy(policy: Partial<StorePolicy> & { tenant_id: string }) {
  // supabaseManual を使用
  const { data, error } = await supabaseManual
    .from('store_policies')
    .upsert(policy)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update store policy: ${error.message}`);
  }
  return data;
}