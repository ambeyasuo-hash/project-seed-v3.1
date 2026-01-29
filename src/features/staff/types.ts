// src/features/staff/types.ts
// 【無菌室】ここはサーバーコードもクライアントコードも一切含まない、純粋な「定義」のみの場所です。

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

// 詳細データ（店舗のデフォルト設定を含む）
export interface StaffDetail extends Staff {
  contract_config: StaffContractConfig;
  reference_limits: {
    store_max_consecutive_days: number;
  };
}