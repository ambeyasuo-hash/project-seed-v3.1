'use server';

import { supabaseManual } from '@/utils/supabase'; // Manual DB (SHIFT)
import { createMainClient } from '@/lib/db/server'; // Main DB (SEED)
import { revalidatePath } from 'next/cache';
import { TECHNICAL_CONSTANTS } from './constants';
import { isFeatureEnabled } from './features';

// --- 型定義 ---
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

// --- デフォルト値 (フォールバック用) ---
const DEFAULT_STORE_POLICY: Omit<StorePolicy, 'tenant_id'> = {
  shift_cycle: 'monthly',
  salary_closing_day: 99,
  shift_start_day: 1,
  target_labor_cost_rate: 30.0,
  target_sales_daily: 0,
  sanctuary_params: {},
  labor_law_config: {
    max_working_days_consecutive: 6,
    min_interval_hours: 11,
    break_rules: [
      { threshold_hours: 6, break_minutes: 45 },
      { threshold_hours: 8, break_minutes: 60 }
    ]
  },
  thx_mileage_settings: {}
};

// --- Manual DB 操作 (店舗ポリシー) ---

export async function getStorePolicy(tenantId: string): Promise<StorePolicy> {
  try {
    const { data, error } = await supabaseManual
      .from('store_policies')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error || !data) {
      return { tenant_id: tenantId, ...DEFAULT_STORE_POLICY };
    }
    return data as StorePolicy;
  } catch (e) {
    console.error('[Proxy] Critical failure in getStorePolicy:', e);
    return { tenant_id: tenantId, ...DEFAULT_STORE_POLICY };
  }
}

export async function upsertStorePolicy(policy: Partial<StorePolicy> & { tenant_id: string }) {
  const { data, error } = await supabaseManual
    .from('store_policies')
    .upsert(policy)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[Proxy] Upsert Error:', error.message);
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/settings');
  return data;
}

// --- Main DB 操作 (機能フラグ) ---

export async function updateTenantFlag(tenantId: string, key: string, value: boolean) {
  const supabase = createMainClient();

  // 1. 現在のフラグを取得
  const { data, error: fetchError } = await supabase
    .from('tenants')
    .select('tenant_flags')
    .eq('id', tenantId)
    .maybeSingle();

  if (fetchError) throw new Error('フラグ情報の取得に失敗しました');

  const currentFlags = (data?.tenant_flags || {}) as Record<string, boolean>;
  const updatedFlags = { ...currentFlags, [key]: value };

  // 2. フラグを更新
  const { error: updateError } = await supabase
    .from('tenants')
    .update({ tenant_flags: updatedFlags })
    .eq('id', tenantId);

  if (updateError) throw new Error('フラグ情報の更新に失敗しました');

  revalidatePath('/dashboard/settings');
  return { success: true };
}

// --- 既存の Gateway Proxy (維持) ---
type FeatureKey = keyof typeof TECHNICAL_CONSTANTS.FEATURES;

export const gatewayProxy = async <T>(
  featureKey: FeatureKey,
  action: () => Promise<T>
): Promise<T> => {
  if (!isFeatureEnabled(featureKey)) {
    throw new Error(`機能「${featureKey}」は現在無効化されています。`);
  }
  try {
    return await action();
  } catch (error) {
    console.error(`[Proxy Gateway Error] ${featureKey}:`, error);
    throw error;
  }
};