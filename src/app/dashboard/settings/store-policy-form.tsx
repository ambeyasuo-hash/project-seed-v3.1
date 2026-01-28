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

  // --- ヘルパー: カンマ区切りの数値入力を数値型に変換 ---
  const handleSalesTargetChange = (value: string) => {
    // 数字以外を削除して数値に変換
    const numValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    setFormData({ ...formData, target_sales_daily: numValue });
  };

  // --- 労基法設定(labor_law_config)の更新用ヘルパー ---
  const updateLawConfig = (updates: Partial<StorePolicy['labor_law_config']>) => {
    setFormData(prev => ({
      ...prev,
      labor_law_config: {
        ...prev.labor_law_config,
        ...updates
      }
    }));
  };

  const addBreakRule = () => {
    const currentRules = formData.labor_law_config.break_rules || [];
    updateLawConfig({
      break_rules: [...currentRules, { threshold_hours: 6, break_minutes: 45 }]
    });
  };

  const removeBreakRule = (index: number) => {
    const currentRules = [...formData.labor_law_config.break_rules];
    currentRules.splice(index, 1);
    updateLawConfig({ break_rules: currentRules });
  };

  const updateBreakRule = (index: number, field: 'threshold_hours' | 'break_minutes', value: number) => {
    const currentRules = [...formData.labor_law_config.break_rules];
    currentRules[index] = { ...currentRules[index], [field]: value };
    updateLawConfig({ break_rules: currentRules });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await upsertStorePolicy({ ...formData, tenant_id: tenantId });
      alert('店舗ポリシーを保存し、ガードレールを更新しました。');
      window.location.reload(); 
    } catch (error: any) {
      console.error('[UI] Save failed:', error);
      alert(`保存に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 border rounded-xl shadow-sm space-y-8">
      
      {/* SECTION 1: 運営数値目標 */}
      <section className="space-y-4">
        <h3 className="text-md font-bold text-gray-800 border-l-4 border-blue-500 pl-2">
          基本運営ポリシー & 数値目標
        </h3>
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
              type="number" step="0.1"
              className="w-full border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              value={formData.target_labor_cost_rate}
              onChange={(e) => setFormData({...formData, target_labor_cost_rate: parseFloat(e.target.value)})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">標準売上目標 (日次/円)</label>
            <div className="relative">
              <input 
                type="text" 
                className="w-full border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-right pr-8"
                placeholder="0"
                value={formData.target_sales_daily.toLocaleString()}
                onChange={(e) => handleSalesTargetChange(e.target.value)}
              />
              <span className="absolute right-3 top-2.5 text-gray-400 text-sm">円</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">※カンマは自動で付与されます</p>
          </div>
        </div>
      </section>

      {/* SECTION 2: 労基法ガードレール */}
      <section className="space-y-4 pt-6 border-t">
        <h3 className="text-md font-bold text-gray-800 border-l-4 border-red-500 pl-2">
          労基法ガードレール設定 (Hard Rail)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 rounded-lg">
            <label className="block text-sm font-bold text-slate-700 mb-2">最大連勤数制限</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" min="1" max="14"
                className="w-20 border rounded-md p-2 bg-white outline-none focus:ring-2 focus:ring-red-200"
                value={formData.labor_law_config.max_working_days_consecutive}
                onChange={(e) => updateLawConfig({ max_working_days_consecutive: parseInt(e.target.value) })}
              />
              <span className="text-sm text-slate-600 font-medium">日連続まで</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">※14日（4週4休運用）を超える設定はできません。</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <label className="block text-sm font-bold text-slate-700 mb-2">勤務間インターバル</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" min="0" max="24"
                className="w-20 border rounded-md p-2 bg-white outline-none focus:ring-2 focus:ring-red-200"
                value={formData.labor_law_config.min_interval_hours}
                onChange={(e) => updateLawConfig({ min_interval_hours: parseInt(e.target.value) })}
              />
              <span className="text-sm text-slate-600 font-medium">時間あける</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">※退勤から次回の出勤までに必要な最低時間。</p>
          </div>
        </div>

        {/* 休憩ルール */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700">休憩付与ルール設定</label>
          <div className="grid gap-2">
            {formData.labor_law_config.break_rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-3 bg-white p-3 border rounded-lg shadow-sm border-slate-200">
                <span className="text-sm text-slate-500">勤務時間が</span>
                <input 
                  type="number" step="0.5"
                  className="w-16 border-b-2 border-slate-200 text-center font-bold focus:border-red-400 outline-none"
                  value={rule.threshold_hours}
                  onChange={(e) => updateBreakRule(index, 'threshold_hours', parseFloat(e.target.value))}
                />
                <span className="text-sm text-slate-500">h を超える場合、</span>
                <input 
                  type="number"
                  className="w-16 border-b-2 border-slate-200 text-center font-bold focus:border-red-400 outline-none"
                  value={rule.break_minutes}
                  onChange={(e) => updateBreakRule(index, 'break_minutes', parseInt(e.target.value))}
                />
                <span className="text-sm text-slate-500">分付与</span>
                <button 
                  type="button"
                  onClick={() => removeBreakRule(index)}
                  className="ml-auto text-slate-300 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button 
            type="button"
            onClick={addBreakRule}
            className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 transition-colors bg-red-50 px-3 py-1.5 rounded-full"
          >
            ＋ ルールを追加 (休憩)
          </button>
        </div>
      </section>

      <div className="pt-6">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-black disabled:bg-slate-300 transition-all shadow-xl flex justify-center items-center gap-2"
        >
          {loading ? '設定を同期中...' : '店舗ポリシーを保存してシステムに適用'}
        </button>
      </div>
    </form>
  );
}