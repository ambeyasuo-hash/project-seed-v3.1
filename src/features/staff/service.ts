// src/features/staff/service.ts
import "server-only"; // ⚠️ 絶対に削除しないこと
import { createClient } from '@supabase/supabase-js';
import { Staff, StaffDetail, StaffContractConfig } from "./types"; // 安全な型定義をインポート

const supabaseAdmin = createClient(
  process.env.MANUAL_DB_URL!,
  process.env.SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// テナントID（以前の成功体験から固定値を維持）
export const HARDCODED_TENANT_ID = 'e97e2f12-f705-40d1-9304-63304918e77c';

// --- Read: 一覧取得 ---
export async function getStaffList(): Promise<Staff[]> {
  const { data, error } = await supabaseAdmin
    .from('staff')
    .select('id, display_name, store_role, is_active')
    .eq('tenant_id', HARDCODED_TENANT_ID)
    .order('display_name', { ascending: true });

  if (error) {
    console.error('Fetch Staff Error:', error);
    return [];
  }
  return data || [];
}

// --- Read: 詳細取得（継承ロジック入り） ---
export async function getStaffDetail(staffId: string): Promise<StaffDetail> {
  const [staffRes, policyRes, storeRes] = await Promise.all([
    supabaseAdmin.from('staff').select('*').eq('id', staffId).single(),
    supabaseAdmin.from('staff_policies').select('contract_config').eq('staff_id', staffId).maybeSingle(),
    supabaseAdmin.from('store_policies').select('labor_law_config').eq('tenant_id', HARDCODED_TENANT_ID).maybeSingle()
  ]);

  if (staffRes.error || !staffRes.data) throw new Error("Staff not found");

  // 店舗設定の連勤制限（デフォルト6日）
  const storeLimit = storeRes.data?.labor_law_config?.max_working_days_consecutive ?? 6;

  // デフォルト値と個別設定のマージ
  const contract_config: StaffContractConfig = {
    max_hours_per_week: 40,
    midnight_work_allowed: true,
    max_consecutive_working_days: storeLimit,
    ...(policyRes.data?.contract_config as any)
  };

  return {
    ...staffRes.data,
    contract_config,
    reference_limits: { store_max_consecutive_days: storeLimit }
  };
}

// --- Write: 保存処理（特権） ---
export async function upsertStaffPolicy(staffId: string, config: StaffContractConfig) {
  const { error } = await supabaseAdmin.from('staff_policies').upsert({
    staff_id: staffId,
    tenant_id: HARDCODED_TENANT_ID,
    contract_config: config,
    updated_at: new Date().toISOString()
  }, { onConflict: 'staff_id, tenant_id' });
  
  if (error) throw error;
  return { success: true };
}
/**
 * LIFF用: LINE User ID からスタッフを特定する
 */
export async function getStaffByLineId(lineId: string): Promise<Staff | null> {
  const { data, error } = await supabaseAdmin
    .from('staff')
    .select('id, display_name, store_role, is_active') // 必要なカラムを選択
    .eq('line_user_id', lineId) // ※DBのカラム名が line_user_id である前提
    .eq('tenant_id', HARDCODED_TENANT_ID)
    .single();

  if (error) {
    // 見つからない場合は null (未連携) を返す
    return null;
  }
  return data as Staff;
}