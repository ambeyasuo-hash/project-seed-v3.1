import React from 'react';
import { createMainClient } from '@/lib/db/server';
import FeatureToggleForm from './feature-toggle-form';

// 仮のテナントID（開発用ハードコード）
const HARDCODED_TENANT_ID = 'e97e2f12-5c68-411a-bf87-800c63c9b107';

// 機能フラグの定義
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

  // テナント設定の取得
  const { data: tenantData, error } = await supabase
    .from('tenants')
    .select('tenant_flags')
    .eq('id', HARDCODED_TENANT_ID)
    .single();

  if (error) {
    console.error('Error fetching tenant flags:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h1 className="text-2xl font-bold mb-4 text-red-700">機能コントロールセンター</h1>
        <p className="text-red-600">設定の読み込み中にエラーが発生しました。DB接続を確認してください。</p>
      </div>
    );
  }

  // フラグの状態を抽出
  const currentFlags = (tenantData?.tenant_flags || {}) as Record<string, boolean>;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">機能コントロールセンター</h1>
        <p className="text-sm text-gray-500 mt-1">
          テナントID: <span className="font-mono">{HARDCODED_TENANT_ID}</span>
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURE_DEFINITIONS.map((feature) => (
          <div key={feature.key} className="bg-white p-6 border rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-800">{feature.title}</h2>
              <p className="text-sm text-gray-600 mt-1 min-h-[3rem]">
                {feature.description}
              </p>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <FeatureToggleForm
                featureKey={feature.key}
                title={feature.title}
                initialState={!!currentFlags[feature.key]}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}