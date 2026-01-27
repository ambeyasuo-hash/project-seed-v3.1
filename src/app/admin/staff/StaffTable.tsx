// src/app/admin/staff/StaffTable.tsx
import { Database } from "@/types/database";

// 必要なカラムのみを含む Staff の型
type DisplayStaff = Pick<Database['public']['Tables']['staff_data']['Row'], 
  'id' | 'display_name' | 'employment_type' | 'is_admin' | 'created_at' | 'line_id'
>;

interface StaffTableProps {
  staffs: DisplayStaff[];
}

export function StaffTable({ staffs }: StaffTableProps) {
  return (
    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">氏名 (display_name)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LINE ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">役割 (employment_type)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">管理者</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録日時</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {staffs.map((staff) => (
            <tr key={staff.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.display_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.line_id || '未連携'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.employment_type || '未設定'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${staff.is_admin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {staff.is_admin ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(staff.created_at || '').toLocaleDateString('ja-JP')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}