// src/components/staff/shift/ShiftForm.tsx
'use client';

import { Database } from '@/types/database';

type Staff = Database['public']['Tables']['staff_data']['Row'];

interface ShiftFormProps {
  staff: Staff;
  stores: { id: string; name: string }[];
}

export default function ShiftForm({ staff, stores }: ShiftFormProps) {
  return (
    <div className="p-4 border rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-4">シフト提出フォーム (プロトタイプ)</h2>
      <p>スタッフ: {staff.display_name}</p>
      <p>店舗数: {stores.length}</p>
      <div className="mt-4 p-3 bg-blue-50 rounded">
        フォームUIをここに実装予定。
      </div>
    </div>
  );
}