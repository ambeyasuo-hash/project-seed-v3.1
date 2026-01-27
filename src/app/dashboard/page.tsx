import { createManualClient } from "@/lib/db/server";

export default async function DashboardPage() {
    // await を追加
    const supabase = await createManualClient();
  
    // Manual DB からスタッフ一覧を取得
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      // name ではなく display_name でソート
      .order('display_name', { ascending: true });

  if (error) {
    console.error('Error fetching staff:', error);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">ダッシュボード: スタッフ名簿</h1>
      
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名前</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">役割</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
          {staff?.map((person) => (
              <tr key={person.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{person.display_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.store_role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
              </tr>
            ))}
            {(!staff || staff.length === 0) && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">スタッフデータが見つかりません。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}