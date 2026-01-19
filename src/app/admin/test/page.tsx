import { createManualClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TestPage() {
  const supabase = createManualClient(true);
  const { data: staff, error } = await supabase.from('staff').select('*');
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">DB接続テストステータス</h1>
      
      {error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          エラー発生: {error.message}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 text-green-700 rounded-lg font-bold">
            接続成功：{staff?.length || 0} 件のデータを取得しました
          </div>
          <pre className="bg-white border border-gray-200 p-4 rounded-lg overflow-auto text-xs shadow-sm">
            {JSON.stringify(staff, null, 2)}
          </pre>
          <Link href="/" className="text-blue-600 hover:underline text-sm inline-block mt-4">
            ← トップページへ戻る
          </Link>
        </div>
      )}
    </div>
  );
}