import React from 'react';
import Link from 'next/link';
import { getStaffList } from '@/features/staff/service';

// ※Phase 7実装完了まで使用する暫定ID
const HARDCODED_TENANT_ID = 'e97e2f12-f705-40d1-9304-63304918e77c';

export default async function StaffListPage() {
  const staffs = await getStaffList(HARDCODED_TENANT_ID);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">スタッフ就業条件管理</h1>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 text-sm font-bold text-slate-600">氏名</th>
              <th className="p-4 text-sm font-bold text-slate-600">ロール</th>
              <th className="p-4 text-sm font-bold text-slate-600">週上限時間</th>
              <th className="p-4 text-sm font-bold text-slate-600">深夜勤務</th>
              <th className="p-4 text-sm font-bold text-slate-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {staffs.map((staff) => (
              <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{staff.name}</td>
                <td className="p-4">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                    {staff.role}
                  </span>
                </td>
                <td className="p-4 text-slate-600 font-mono">
                  {staff.policy.contract_config.max_hours_per_week}h
                </td>
                <td className="p-4">
                  {staff.policy.contract_config.midnight_work_allowed ? (
                    <span className="text-green-600 text-sm">可</span>
                  ) : (
                    <span className="text-slate-400 text-sm">不可</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <Link
                    href={`/dashboard/staff/${staff.id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-xs font-bold rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    設定を変更
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}