import React from 'react';
import { createMainClient } from '@/lib/db/server';
import { getStorePolicy } from '@/lib/proxy';
import FeatureToggleForm from '@/app/dashboard/settings/features/feature-toggle-form'; 
import StorePolicyForm from './store-policy-form';

const HARDCODED_TENANT_ID = 'e97e2f12-5c68-411a-bf87-800c63c9b107';

const FEATURE_DEFINITIONS = [
  {
    key: 'shift_optimizer_enabled',
    title: 'AIシフト最適化',
    description: 'スタッフのスキルと希望を元にシフトを自動生成・最適化します。',
  },
  {
    key: 'mental_log_enabled',
    title: 'AIメンタルログ分析',
    description: '暗号化されたチャットログを分析し、組織の心理的安全性を評価・提言します。',
  },
];

export default async function FeatureControlCenterPage() {
  const supabase = createMainClient();
  let currentFlags: Record<string, boolean> = {};

  // 1. テナントフラグの取得 (Main DB - SEED)
  try {
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('tenant_flags')
      .eq('id', HARDCODED_TENANT_ID)
      .maybeSingle();
    
    if (tenantData?.tenant_flags) {
      currentFlags = tenantData.tenant_flags as Record<string, boolean>;
    }
  } catch (err) {
    console.error('[MainDB] Failed to fetch flags:', err);
    // エラー時はデフォルト(空)で続行
  }

  // 2. 店舗ポリシーの取得 (Manual DB - SHIFT via Proxy)
  // Proxy内でエラーハンドリング済みのため安全
  const storePolicy = await getStorePolicy(HARDCODED_TENANT_ID);

  return (
    <div className="p-6 space-y-10">
      {/* セクション1: 機能コントロール */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">機能コントロールセンター</h1>
          <p className="text-sm text-gray-500 mt-1">
            テナントID: <span className="font-mono">{HARDCODED_TENANT_ID}</span>
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {FEATURE_DEFINITIONS.map((feature) => (
            <div key={feature.key} className="bg-white p-6 border rounded-xl shadow-sm">
              <h2 className="text-lg font-bold text-gray-800">{feature.title}</h2>
              <p className="text-sm text-gray-600 mt-1 mb-4">{feature.description}</p>
              <FeatureToggleForm
                featureKey={feature.key}
                title={feature.title}
                initialState={!!currentFlags[feature.key]}
                tenantId={HARDCODED_TENANT_ID}
              />
            </div>
          ))}
        </div>
      </div>

      {/* セクション2: 店舗基本ポリシー (Phase 6.1) */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">店舗運営ルール設定</h2>
          <p className="text-sm text-gray-500 mt-1">シフト生成やコスト計算の基準となる制約を定義します。</p>
        </div>
        <div className="max-w-4xl">
          <StorePolicyForm initialData={storePolicy} tenantId={HARDCODED_TENANT_ID} />
        </div>
      </div>
    </div>
  );
}