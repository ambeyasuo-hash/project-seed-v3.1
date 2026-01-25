import React from 'react';
import { createMainClient } from '@/lib/supabase/server'; // Main DB接続 (エイリアスへ変更)
// 削除: import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'; 
import FeatureToggleForm from './feature-toggle-form'; // クライアントコンポーネントをインポート

// 仮のテナントID（ハードコード）
const HARDCODED_TENANT_ID = 'db86e974-90a4-471a-b0f3-94c0429f635c';

// 機能フラグのデフォルト定義と説明
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

  // 1. テナントフラグの取得
  const { data: tenantData, error } = await supabase
    .from('tenants')
    .select('tenant_flags')
    .eq('id', HARDCODED_TENANT_ID)
    .single();

  if (error) {
    console.error('Error fetching tenant flags:', error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">機能コントロールセンター</h1>
        <p className="text-red-500">機能設定の読み込み中にエラーが発生しました。</p>
      </div>
    );
  }

  // 2. フラグの状態を抽出（JSONBから）
  const currentFlags = (tenantData?.tenant_flags || {}) as Record<string, boolean>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">機能コントロールセンター</h1>
      <p className="text-gray-600 mb-6">テナントID: {HARDCODED_TENANT_ID}</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURE_DEFINITIONS.map((feature) => (
          <div key={feature.key} className="p-4 border rounded-lg shadow-md"> {/* Cardの代替 */}
            <div className="mb-2"> {/* CardHeaderの代替 */}
              <h2 className="text-lg font-semibold">{feature.title}</h2> {/* CardTitleの代替 */}
              <p className="text-sm text-gray-500">{feature.description}</p> {/* CardDescriptionの代替 */}
            </div>
            <div className="pt-2 border-t"> {/* CardContentの代替 */}
              {/* クライアントコンポーネントに現在の状態と定義を渡す */}
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