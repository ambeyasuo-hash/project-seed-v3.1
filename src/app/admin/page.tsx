import { createManualClient } from '@/lib/supabase/server';
import { gatewayProxy } from '@/lib/proxy';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Proxy Gateway を経由してスタッフ一覧を取得
  const staffList = await gatewayProxy('ENABLE_SHIFT_MANAGEMENT', async () => {
    const supabase = createManualClient(true);
    const { data } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
    return data || [];
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">管理者ダッシュボード</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">トップへ戻る</Link>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-700">スタッフ名簿（Manual DB連携）</h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {staffList.map((staff: any) => (
            <li key={staff.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
              <div>
                <span className="font-medium text-gray-900">{staff.display_name}</span>
                <span className="ml-3 text-xs px-2 py-1 bg-gray-200 rounded text-gray-600">
                  {staff.employment_type}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                スコア: {staff.engagement_score}
              </div>
            </li>
          ))}
          {staffList.length === 0 && (
            <li className="p-8 text-center text-gray-500">スタッフが登録されていません</li>
          )}
        </ul>
      </div>
    </div>
  );
}