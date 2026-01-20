import { createMainClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import ShiftClient from '@/components/staff/shift/ShiftClient';
import { AlertTriangle } from 'lucide-react';

export default async function ShiftPage() {
  // DBから店舗情報を取得
  const cookieStore = cookies();
  const supabase = createMainClient(cookieStore);
  
  // storesテーブルから id, name を取得
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id, name');

  if (storesError || !stores) {
     // エラーハンドリング
     return (
         <div className="p-4">
             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                 <AlertTriangle className="inline-block w-5 h-5 mr-2" />
                 <span className="block sm:inline">店舗情報取得エラー: {storesError?.message || '不明なエラー'}</span>
             </div>
         </div>
     );
  }

  // Client Componentに店舗情報を渡す
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">シフト提出</h1>
      <ShiftClient stores={stores} />
    </div>
  );
}