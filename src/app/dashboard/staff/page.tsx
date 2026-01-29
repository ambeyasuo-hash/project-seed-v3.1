import { getStaffList, Staff } from "@/features/staff/service";
import Link from "next/link";

export default async function StaffListPage() {
  const staffs = await getStaffList();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">スタッフ個別設定</h1>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y">
          <tbody className="divide-y">
            {staffs.map((staff: Staff) => (
              <tr key={staff.id}>
                <td className="px-6 py-4">{staff.display_name}</td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/dashboard/staff/${staff.id}`} // ツリー構造 src/app/dashboard/staff/[id] に完全一致させる
                    className="text-blue-600 font-medium"
                  >
                    設定編集 →
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