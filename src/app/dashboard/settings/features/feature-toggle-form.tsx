'use client';

import { useState } from 'react';
import { updateTenantFlag } from '@/lib/proxy';

interface FeatureToggleFormProps {
  featureKey: string;
  title: string;
  initialState: boolean;
  tenantId?: string; // オプショナルに変更
}

// 固定IDの使用（開発フェーズ用）
const HARDCODED_TENANT_ID = 'e97e2f12-5c68-411a-bf87-800c63c9b107';

export default function FeatureToggleForm({ featureKey, title, initialState }: FeatureToggleFormProps) {
  const [enabled, setEnabled] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      // Server Action を呼び出し
      await updateTenantFlag(HARDCODED_TENANT_ID, featureKey, !enabled);
      setEnabled(!enabled);
    } catch (error) {
      console.error(error);
      alert('設定の変更に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm font-medium text-gray-700">状態: {enabled ? '有効' : '無効'}</span>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}