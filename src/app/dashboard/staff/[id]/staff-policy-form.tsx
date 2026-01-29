"use client";

import { useState } from "react";
// 修正箇所 1: 型定義を types.ts からインポート
import { StaffContractConfig } from "@/features/staff/types";
// 修正箇所 2: 直接 service を呼ばず、actions を経由する
import { updateStaffPolicyAction } from "@/features/staff/actions";

interface Props {
  staffId: string;
  initialData: StaffContractConfig;
  storeLimit: number;
}

export function StaffPolicyForm({ staffId, initialData, storeLimit }: Props) {
  const [formData, setFormData] = useState<StaffContractConfig>(initialData);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => { // eを受け取るように修正
    e.preventDefault(); // フォーム送信のデフォルト挙動を防止
    setLoading(true);
    
    const res = await updateStaffPolicyAction(staffId, formData);
    
    if (res.success) {
      alert("設定を保存しました");
    } else {
      alert("エラー: " + res.error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* 週上限 */}
      <div className="flex justify-between items-center">
        <div>
          <label className="block font-medium">週あたりの最大労働時間</label>
          <p className="text-xs text-gray-500">契約上の上限時間を入力してください</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" value={formData.max_hours_per_week} 
            onChange={e => setFormData({...formData, max_hours_per_week: Number(e.target.value)})}
            className="border rounded p-2 w-20 text-right" />
          <span className="text-sm">時間</span>
        </div>
      </div>

      {/* 連勤制限 */}
      <div className="flex justify-between items-center border-t pt-4">
        <div>
          <label className="block font-medium">最大連続勤務日数</label>
          <p className="text-xs text-gray-500">店舗基本設定: {storeLimit}日</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" value={formData.max_consecutive_working_days} 
            onChange={e => setFormData({...formData, max_consecutive_working_days: Number(e.target.value)})}
            className="border rounded p-2 w-20 text-right" />
          <span className="text-sm">日</span>
        </div>
      </div>

      {/* 深夜労働 */}
      <div className="flex justify-between items-center border-t pt-4">
        <div>
          <label className="block font-medium">深夜労働の可否</label>
          <p className="text-xs text-gray-500">22:00〜05:00の勤務を許可するか</p>
        </div>
        <input type="checkbox" checked={formData.midnight_work_allowed} 
          onChange={e => setFormData({...formData, midnight_work_allowed: e.target.checked})}
          className="h-6 w-6 rounded border-gray-300 text-blue-600" />
      </div>

      <button onClick={handleSubmit} disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 mt-4 transition-colors">
        {loading ? "保存中..." : "この内容で契約条件を更新"}
      </button>
    </div>
  );
}