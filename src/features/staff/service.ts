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
  policy: {
    contract_config: StaffPolicy['contract_config'];
  };
};

export async function getStaffList(tenantId: string): Promise<StaffWithPolicy[]> {
  // 1. 本来の「tenant_id」による絞り込みを実行
  const { data: staffs, error: sError } = await (supabaseManual as any)
    .from('staff')
    .select('*')
    .eq('tenant_id', tenantId); // 憲法に基づき復活

  if (sError) throw sError;

  const { data: policies, error: pError } = await supabaseManual
    .from('staff_policies')
    .select('*')
    .eq('tenant_id', tenantId);

  if (pError) throw pError;

  return (staffs as any[]).map(s => {
    const policy = policies?.find(p => p.staff_id === s.id);
    
    // ビューの定義（last_name, first_name）に準拠して名前を合成
    const fullName = `${s.last_name || ''} ${s.first_name || ''}`.trim() || '名称未設定';

    return {
      id: s.id,
      name: fullName,
      role: s.role || '一般',
      policy: {
        contract_config: policy?.contract_config || {
          max_hours_per_week: 40,
          midnight_work_allowed: true,
          max_consecutive_working_days: 6
        }
      }
    };
  });
}