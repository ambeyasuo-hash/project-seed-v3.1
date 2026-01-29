import { getStaffList, getStaffPolicy, Staff } from "@/features/staff/service";
import { StaffPolicyForm } from "./staff-policy-form";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StaffDetailPage({ params }: { params: { id: string } }) {
  const staffList = await getStaffList();
  const staff = staffList.find((s: Staff) => s.id === params.id);

  if (!staff) notFound();

  const initialPolicy = await getStaffPolicy(params.id);
  const defaultPolicy = {
    max_hours_per_week: 40,
    midnight_work_allowed: false,
    max_consecutive_working_days: 6,
    ...initialPolicy
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link href="/dashboard/staff" className="text-sm text-gray-500">← 戻る</Link>
      <h1 className="text-xl font-bold mt-4">{staff.display_name} の個別条件</h1>
      <div className="mt-6 bg-white border rounded-lg p-6 shadow-sm">
        <StaffPolicyForm staffId={staff.id} initialData={defaultPolicy} />
      </div>
    </div>
  );
}