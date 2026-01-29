"use client";
import { useState } from "react";
import { StaffContractConfig } from "@/features/staff/service";
import { updateStaffPolicyAction } from "../actions"; // src/app/dashboard/staff/actions.tsを参照

export function StaffPolicyForm({ staffId, initialData }: { staffId: string; initialData: StaffContractConfig }) {
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await updateStaffPolicyAction(staffId, data);
    if (res.success) alert("保存完了");
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm">週最大労働時間</label>
        <input type="number" value={data.max_hours_per_week} 
          onChange={e => setData({...data, max_hours_per_week: Number(e.target.value)})}
          className="border rounded px-2 py-1 w-20" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={data.midnight_work_allowed} 
          onChange={e => setData({...data, midnight_work_allowed: e.target.checked})} />
        <label className="text-sm">深夜労働を許可</label>
      </div>
      <button onClick={save} disabled={saving} className="w-full bg-blue-600 text-white py-2 rounded">
        {saving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}