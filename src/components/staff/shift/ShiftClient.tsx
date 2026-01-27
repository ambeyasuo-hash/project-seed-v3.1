// src/components/staff/shift/ShiftClient.tsx
'use client';

// 修正 1: インポートパスを修正
import { useLiff } from '@/components/providers/LiffProvider';
import ShiftForm from '@/components/staff/shift/ShiftForm';
import { useEffect, useState } from 'react';
import { getStaffByLineId } from '@/features/staff/actions';
// 修正 2: Tables/schema の代わりに Database をインポート
import { Database } from '@/types/database'; 

// Staff型を定義 (Supabase CLI生成のDatabase型から抽出)
type Staff = Database['public']['Tables']['staff_data']['Row'];

interface ShiftClientProps {
  stores: { id: string; name: string }[];
}

export default function ShiftClient({ stores }: ShiftClientProps) {
  const { lineProfile, isLoggedIn, isLiffInitialized, error } = useLiff();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStaff() {
      if (isLiffInitialized && isLoggedIn && lineProfile?.userId) {
        setLoading(true);
        setFetchError(null);
        try {
          const result = await getStaffByLineId(lineProfile.userId);
          if ('success' in result) {
            // 戻り値のプロパティ名が 'staff' である可能性を考慮し、
            // actions.ts の戻り値に合わせて修正が必要。
            // page.tsx の修正から 'staff' と仮定する。
            // result.data は page.tsx で result.staff に修正したため、ここも修正
            setStaff(result.staff as Staff); 
          } else {
            setFetchError(result.error);
            setStaff(null);
          }
        } catch (e) {
          setFetchError('スタッフ情報の取得中に予期せぬエラーが発生しました。');
          setStaff(null);
        } finally {
          setLoading(false);
        }
      } else if (isLiffInitialized && !isLoggedIn) {
         setLoading(false);
         setFetchError("LINEにログインされていません。");
      } else if (error) {
         setLoading(false);
         setFetchError(`LIFFエラー: ${error}`);
      } else {
         // 初期化待ち
      }
    }
    fetchStaff();
  }, [isLiffInitialized, isLoggedIn, lineProfile, error]);

  if (loading) {
    return <div className="p-4">LINE認証とスタッフ情報を確認中です...</div>;
  }

  if (fetchError) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">認証エラー</strong>
          <span className="block sm:inline">：{fetchError}</span>
          {!isLoggedIn && (
             <div className="mt-2 text-sm">LINEアプリ内で開き、ログインしてください。</div>
          )}
        </div>
      </div>
    );
  }

  if (!staff) {
     return (
         <div className="p-4">
           <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
             <strong className="font-bold">未登録</strong>
             <span className="block sm:inline">：あなたのLINE IDはスタッフ名簿に登録されていません。</span>
           </div>
         </div>
     );
  }

  // スタッフ情報が取得できたらシフトフォームを表示
  return (
    <ShiftForm staff={staff} stores={stores} />
  );
}