'use client';

import React, { useState } from 'react';
import { StorePolicy, upsertStorePolicy } from '@/lib/proxy';

interface StorePolicyFormProps {
  initialData: StorePolicy;
  tenantId: string;
}

export default function StorePolicyForm({ initialData, tenantId }: StorePolicyFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StorePolicy>(initialData);

  /**
   * 売上目標のカンマ区切り入力制御
   */
  const handleSalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 数字以外をすべて除去
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numValue = rawValue === '' ? 0 : parseInt(rawValue, 10);
    
    setFormData({
      ...formData,
      target_sales_daily: numValue
    });
  };

  /**
   * 保存処理 (Server Action 呼び出し)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await upsertStorePolicy({ ...formData, tenant_id: tenantId });
      alert('店舗ポリシーを保存しました。');
    } catch (error: any) {
      console.error('[UI] Save error:', error);
      alert(`保存に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 border rounded-xl shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-lg font-bold text-gray-800">店舗基本ポリシー設定</h2>
        <span className="text-xs text-gray-400 font-mono">ID: {tenantId}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* シフトサイクル */}
        <div>
          <label className="block text-sm font-medium text-gray-700">シフトサイクル</label>
          <select 
            className="mt-1 block w-full border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.shift_cycle}
            onChange={(e) => setFormData({...formData, shift_cycle: e.target.value as any})}
          >
            <option value="weekly">週単位</option>
            <option value="bi_weekly">隔週単位</option>
            <option value="monthly">月単位</option>
          </select>
        </div>

        {/* 給与締め日 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">給与締め日 (1-28, 99:末日)</label>
          <input 
            type="number" 
            min="1"
            max="99"
            className="mt-1 block w-full border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.salary_closing_day}
            onChange={(e) => setFormData({...formData, salary_closing_day: parseInt(e.target.value)})}
          />
        </div>

        {/* 目標人件費率 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">目標人件費率 (%)</label>
          <div className="relative mt-1">
            <input 
              type="number" 
              step="0.1"
              className="block w-full border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.target_labor_cost_rate}
              onChange={(e) => setFormData({...formData, target_labor_cost_rate: parseFloat(e.target.value)})}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
              %
            </div>
          </div>
        </div>

        {/* 標準日次売上目標 (カンマ区切り対応) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">標準日次売上目標 (円)</label>
          <div className="relative mt-1">
            <input 
              type="text" 
              className="block w-full border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
              value={formData.target_sales_daily.toLocaleString()}
              onChange={handleSalesChange}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              ¥
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">※シフト生成時の人件費計算基準になります</p>
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-all shadow-md active:transform active:scale-[0.98]"
        >
          {loading ? '設定を同期中...' : '店舗ポリシーを保存する'}
        </button>
      </div>
    </form>
  );
}