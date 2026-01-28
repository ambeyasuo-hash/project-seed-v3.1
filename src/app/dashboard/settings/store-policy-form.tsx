'use client';

import React, { useState } from 'react';
import { StorePolicy, upsertStorePolicy } from '@/lib/proxy';

export default function StorePolicyForm({ 
  initialData, 
  tenantId 
}: { 
  initialData: StorePolicy, 
  tenantId: string 
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StorePolicy>(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await upsertStorePolicy(formData);
      alert('店舗ポリシーを保存しました。');
      // データの整合性を保つため、保存後に最新状態を再取得（リロード）
      window.location.reload();
    } catch (error: any) {
      console.error('[UI] Save failed:', error);
      alert(`保存に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 border rounded-xl shadow-sm space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">シフトサイクル</label>
          <select 
            className="w-full border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.shift_cycle}
            onChange={(e) => setFormData({...formData, shift_cycle: e.target.value as any})}
          >
            <option value="weekly">週単位</option>
            <option value="bi_weekly">隔週単位</option>
            <option value="monthly">月単位</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">給与締め日</label>
          <select 
            className="w-full border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.salary_closing_day}
            onChange={(e) => setFormData({...formData, salary_closing_day: parseInt(e.target.value)})}
          >
            {[...Array(28)].map((_, i) => (
              <option key={i+1} value={i+1}>{i+1}日</option>
            ))}
            <option value={99}>末日</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">目標人件費率 (%)</label>
          <input 
            type="number" 
            step="0.1"
            className="w-full border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.target_labor_cost_rate}
            onChange={(e) => setFormData({...formData, target_labor_cost_rate: parseFloat(e.target.value)})}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">標準売上目標 (日次/円)</label>
          <input 
            type="number" 
            className="w-full border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.target_sales_daily}
            onChange={(e) => setFormData({...formData, target_sales_daily: parseInt(e.target.value)})}
          />
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all shadow-md"
        >
          {loading ? '設定を同期中...' : '店舗ポリシーを保存して適用'}
        </button>
      </div>
    </form>
  );
}