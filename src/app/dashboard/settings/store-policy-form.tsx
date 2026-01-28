'use client';

import React, { useState } from 'react';
import { StorePolicy, upsertStorePolicy } from '@/lib/proxy';

export default function StorePolicyForm({ 
  initialData, 
  tenantId 
}: { 
  initialData: StorePolicy | null, 
  tenantId: string 
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<StorePolicy>>(
    initialData || {
      tenant_id: tenantId,
      shift_cycle: 'monthly',
      salary_closing_day: 99,
      shift_start_day: 1,
      target_labor_cost_rate: 30,
      target_sales_daily: 0,
    }
  );

  // handleSubmit 内の修正
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await upsertStorePolicy({ ...formData, tenant_id: tenantId } as StorePolicy);
      alert('店舗ポリシーを保存しました。');
      window.location.reload(); // データを再取得するためにリロード
    } catch (error) {
      console.error(error);
      alert('保存に失敗しました。詳細はコンソールを確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 border rounded-xl shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-gray-800 border-b pb-2">店舗基本ポリシー設定</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">シフトサイクル</label>
          <select 
            className="mt-1 block w-full border rounded-md p-2"
            value={formData.shift_cycle}
            onChange={(e) => setFormData({...formData, shift_cycle: e.target.value as any})}
          >
            <option value="weekly">週単位</option>
            <option value="bi_weekly">隔週単位</option>
            <option value="monthly">月単位</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">給与締め日 (1-28, 99:末日)</label>
          <input 
            type="number" 
            className="mt-1 block w-full border rounded-md p-2"
            value={formData.salary_closing_day}
            onChange={(e) => setFormData({...formData, salary_closing_day: parseInt(e.target.value)})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">目標人件費率 (%)</label>
          <input 
            type="number" 
            step="0.1"
            className="mt-1 block w-full border rounded-md p-2"
            value={formData.target_labor_cost_rate}
            onChange={(e) => setFormData({...formData, target_labor_cost_rate: parseFloat(e.target.value)})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">標準日次売上目標 (円)</label>
          <input 
            type="number" 
            className="mt-1 block w-full border rounded-md p-2"
            value={formData.target_sales_daily}
            onChange={(e) => setFormData({...formData, target_sales_daily: parseInt(e.target.value)})}
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
      >
        {loading ? '保存中...' : '設定を保存する'}
      </button>
    </form>
  );
}