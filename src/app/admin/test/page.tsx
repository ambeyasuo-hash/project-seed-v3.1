import { createManualClient } from '@/lib/supabase/server';

// キャッシュを無効化する設定を追加
export const dynamic = 'force-dynamic';

export default async function TestPage() {
  // 第二引数を true にして、管理者権限（SERVICE_ROLE_KEY）で試行
  const supabase = createManualClient(true);
  const { data: staff, error } = await supabase.from('staff').select('*');
  
  const connectedUrl = process.env.MANUAL_DB_URL;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">DB接続テスト (強制リロード版)</h1>
      <p className="mb-2 text-sm text-gray-500">接続先URL: {connectedUrl}</p>
      
      {error ? (
        <p className="text-red-500">エラー発生: {error.message}</p>
      ) : (
        <div>
          <p className="mb-2 text-green-600 font-bold">取得件数: {staff?.length || 0} 件</p>
          <pre className="bg-gray-100 p-4 rounded text-xs">
            {JSON.stringify(staff, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}