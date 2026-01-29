import { getStaffDetail } from "@/features/staff/service";
import { StaffPolicyForm } from "./staff-policy-form";
import Link from "next/link";

export default async function StaffDetailPage({ params }: { params: { id: string } }) {
  const staffDetail = await getStaffDetail(params.id);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/dashboard/staff" className="text-sm text-blue-600">← スタッフ一覧に戻る</Link>
      
      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-bold">{staffDetail.display_name}</h1>
        <p className="text-gray-500">役割: {staffDetail.store_role}</p>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6 border-b pb-2">個別就業条件（ガードレール）</h2>
        <StaffPolicyForm 
          staffId={staffDetail.id} 
          initialData={staffDetail.contract_config}
          storeLimit={staffDetail.reference_limits.store_max_consecutive_days}
        />
      </div>
    </div>
  );
}