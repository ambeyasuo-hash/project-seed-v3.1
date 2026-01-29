import "server-only";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.MANUAL_DB_URL!;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const HARDCODED_TENANT_ID = 'e97e2f12-da39-4361-8408-013b86566812';

export interface Staff {
  id: string;
  display_name: string;
  store_role: string;
  is_active: boolean;
}

export interface StaffContractConfig {
  max_hours_per_week: number;
  midnight_work_allowed: boolean;
  max_consecutive_working_days: number;
}

/**
 * 個別関数エクスポート (page.tsx用)
 */
export async function getStaffList(): Promise<Staff[]> {
  const { data, error } = await supabaseAdmin
    .from('staff')
    .select('id, display_name, store_role, is_active')
    .eq('tenant_id', HARDCODED_TENANT_ID);

  if (error) {
    console.error('❌ SHIFT DB Fetch Error:', error.message);
    return [];
  }
  return data || [];
}

export async function getStaffPolicy(staffId: string): Promise<StaffContractConfig | null> {
  const { data, error } = await supabaseAdmin
    .from('staff_policies')
    .select('contract_config')
    .eq('staff_id', staffId)
    .eq('tenant_id', HARDCODED_TENANT_ID)
    .single();

  if (error && error.code !== 'PGRST116') return null;
  return data?.contract_config as StaffContractConfig | null;
}

export async function upsertStaffPolicy(staffId: string, config: StaffContractConfig) {
  const { error } = await supabaseAdmin
    .from('staff_policies')
    .upsert({
      staff_id: staffId,
      tenant_id: HARDCODED_TENANT_ID,
      contract_config: config,
      updated_at: new Date().toISOString()
    }, { onConflict: 'staff_id, tenant_id' });

  if (error) throw error;
  return { success: true };
}

/**
 * オブジェクト形式エクスポート (actions.ts用)
 * これが欠落していたためエラーが発生していました
 */
export const staffService = {
  getStaffList,
  getStaffPolicy,
  upsertStaffPolicy
};