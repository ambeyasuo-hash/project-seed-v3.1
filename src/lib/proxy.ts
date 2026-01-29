'use server';

import { supabaseManual } from '@/utils/supabase'; // 内部利用のみにする（exportしない）
import { createMainClient } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';

/**
 * 型定義 (Typeのみのエクスポートは許容されることが多いですが、安全のため関数の外に出さないか、
 * 必要なら src/types/index.ts 等に移動してください)
 */
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

/**
 * 店舗ポリシー操作 (Server Action)
 */
export async function getStorePolicy(tenantId: string): Promise<StorePolicy> {
  const { data, error } = await supabaseManual
    .from('store_policies')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error || !data) return { tenant_id: tenantId, ...DEFAULT_STORE_POLICY };
  return data as StorePolicy;
}

export async function upsertStorePolicy(policy: Partial<StorePolicy> & { tenant_id: string }) {
  const { data, error } = await supabaseManual.from('store_policies').upsert(policy).select().maybeSingle();
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/settings');
  return data;
}

/**
 * スタッフ個別ポリシー操作 (Server Action)
 */
export async function upsertStaffPolicy(
  staffId: string, 
  tenantId: string, 
  contractConfig: any
) {
  const { data, error } = await supabaseManual
    .from('staff_policies')
    .upsert({
      staff_id: staffId,
      tenant_id: tenantId,
      contract_config: contractConfig,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'staff_id'
    })
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/staff');
  return data;
}

/**
 * メインDB(SEED)操作 (Server Action)
 */
export async function updateTenantFlag(tenantId: string, key: string, value: boolean) {
  const supabase = createMainClient();
  const { data } = await supabase.from('tenants').select('tenant_flags').eq('id', tenantId).maybeSingle();
  const updatedFlags = { ...((data?.tenant_flags || {}) as object), [key]: value };
  const { error } = await supabase.from('tenants').update({ tenant_flags: updatedFlags }).eq('id', tenantId);
  if (error) throw new Error('フラグ更新失敗');
  revalidatePath('/dashboard/settings');
  return { success: true };
}