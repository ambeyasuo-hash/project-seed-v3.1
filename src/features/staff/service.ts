import "server-only";
import { createClient } from '@supabase/supabase-js';

// SHIFT DB (Manual DB) への特権アクセス設定
const supabaseUrl = process.env.MANUAL_DB_URL!;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// DB実データに準拠したテナントID (Identity Mirroring)
export const HARDCODED_TENANT_ID = 'e97e2f12-f705-40d1-9304-63304918e77c';

// --- 型定義 ---
export interface StaffContractConfig {
  max_hours_per_week: number;
  midnight_work_allowed: boolean;
  max_consecutive_working_days: number;
}

export interface Staff {
  id: string;
  display_name: string;
  store_role: string;
  is_active: boolean;
}

export interface StaffDetail extends Staff {
  contract_config: StaffContractConfig;
  reference_limits: {
    store_max_consecutive_days: number;
  };
}

/**
 * スタッフ一覧の取得 (Named Export)
 */
export async function getStaffList(): Promise<Staff[]> {
  const { data, error } = await supabaseAdmin
    .from('staff')
    .select('id, display_name, store_role, is_active')
    .eq('tenant_id', HARDCODED_TENANT_ID)
    .order('display_name', { ascending: true });

  if (error) {
    console.error('❌ SHIFT DB Fetch Error [getStaffList]:', error.message);
    return [];
  }
  return data || [];
}

/**
 * スタッフ詳細と個別ガードレールの統合取得 (Named Export)
 * 店舗設定を継承しつつ、個別設定を最優先でマージする
 */
export async function getStaffDetail(staffId: string): Promise<StaffDetail> {
  const [staffRes, policyRes, storeRes] = await Promise.all([
    supabaseAdmin.from('staff').select('*').eq('id', staffId).single(),
    // .maybeSingle() を使用して未設定時のエラーを回避
    supabaseAdmin.from('staff_policies').select('contract_config').eq('staff_id', staffId).maybeSingle(),
    supabaseAdmin.from('store_policies').select('labor_law_config').eq('tenant_id', HARDCODED_TENANT_ID).maybeSingle()
  ]);

  if (staffRes.error || !staffRes.data) {
    console.error("❌ Staff Fetch Error:", staffRes.error);
    throw new Error("Staff not found");
  }

  // 店舗のデフォルト値を決定 (未設定なら6日)
  const storeLimit = storeRes.data?.labor_law_config?.max_working_days_consecutive ?? 6;

  // 1. デフォルト設定
  const defaultConfig: StaffContractConfig = {
    max_hours_per_week: 40,
    midnight_work_allowed: true,
    max_consecutive_working_days: storeLimit,
  };

  // 2. DBに保存された個別設定を取得
  const savedConfig = policyRes.data?.contract_config as Partial<StaffContractConfig> | null;
  
  // 3. デフォルトに個別設定を上書きマージ
  const contract_config: StaffContractConfig = {
    ...defaultConfig,
    ...(savedConfig || {})
  };

  return {
    ...staffRes.data,
    contract_config,
    reference_limits: {
      store_max_consecutive_days: storeLimit
    }
  };
}

/**
 * スタッフ個別ガードレールの保存 (Named Export)
 */
export async function upsertStaffPolicy(staffId: string, config: StaffContractConfig) {
  const { error } = await supabaseAdmin
    .from('staff_policies')
    .upsert({
      staff_id: staffId,
      tenant_id: HARDCODED_TENANT_ID,
      contract_config: config,
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'staff_id, tenant_id' 
    });

  if (error) {
    console.error('❌ SHIFT DB Upsert Error:', error.message);
    throw error;
  }
  return { success: true };
}

/**
 * オブジェクト形式エクスポート (既存の actions.ts 等との互換性用)
 */
export const staffService = {
  getStaffList,
  getStaffDetail,
  upsertStaffPolicy
};