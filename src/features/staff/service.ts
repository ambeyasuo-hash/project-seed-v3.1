import { supabaseManual } from '@/utils/supabase';

export type StaffPolicy = {
  staff_id: string;
  tenant_id: string;
  contract_config: {
    max_hours_per_week: number;
    midnight_work_allowed: boolean;
    max_consecutive_working_days: number;
  };
};

export type StaffWithPolicy = {
  id: string;
  name: string;
  role: string;
  policy: StaffPolicy; // 構造をStaffPolicyに統一
};

const DEFAULT_CONTRACT_CONFIG = {
  max_hours_per_week: 40,
  midnight_work_allowed: true,
  max_consecutive_working_days: 6
};

export async function getStaffList(tenantId: string): Promise<StaffWithPolicy[]> {
  const { data: staffs, error: sError } = await (supabaseManual as any)
    .from('staff')
    .select('*')
    .eq('tenant_id', tenantId);

  if (sError) throw sError;

  const { data: policies, error: pError } = await supabaseManual
    .from('staff_policies')
    .select('*')
    .eq('tenant_id', tenantId);

  if (pError) throw pError;

  return (staffs as any[]).map(s => {
    const foundPolicy = policies?.find(p => p.staff_id === s.id);
    
    return {
      id: s.id,
      name: s.display_name || '名称未設定',
      role: s.store_role || '一般',
      // policyをまるごと生成し、undefinedを回避
      policy: {
        staff_id: s.id,
        tenant_id: tenantId,
        contract_config: foundPolicy?.contract_config || DEFAULT_CONTRACT_CONFIG
      }
    };
  });
}

export async function upsertStaffPolicy(policy: StaffPolicy) {
  const { error } = await supabaseManual.from('staff_policies').upsert(policy);
  if (error) throw error;
}