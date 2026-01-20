<<<<<<< HEAD
// src/app/staff/shift/page.tsx
'use client';

import { useLiff } from '@/components/providers/LiffProvider';
import { getStaffByLineId } from '../actions';
import { useEffect, useState } from 'react';
import { Database } from '@/types/database';

// Staff型を定義 (Supabase CLI生成のDatabase型から抽出)
type Staff = Database['public']['Tables']['staff']['Row'];

export default function StaffShiftPage() {
  const { isLiffInitialized, isLoggedIn, lineProfile, error } = useLiff();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      if (isLiffInitialized && isLoggedIn && lineProfile?.userId) {
        try {
          const result = await getStaffByLineId(lineProfile.userId);
          if ('success' in result) {
            setStaff(result.staff as Staff);
          } else {
            console.error('Failed to fetch staff:', result.error);
          }
        } catch (e) {
          console.error('Error during staff fetch:', e);
        } finally {
          setLoading(false);
        }
      } else if (isLiffInitialized && !isLoggedIn) {
        setLoading(false);
      } else if (isLiffInitialized && error) {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [isLiffInitialized, isLoggedIn, lineProfile, error]);

  if (!isLiffInitialized) {
    return <div className="p-4">LIFFを初期化中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">LIFFエラー: {error}</div>;
  }

  if (!isLoggedIn) {
    return <div className="p-4">LINEにログインしてください。</div>;
  }

  if (loading) {
    return <div className="p-4">スタッフ情報を取得中...</div>;
  }

  if (!staff) {
    return <div className="p-4 text-red-500">スタッフ情報が見つかりませんでした。LINE IDが登録されていません。</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">スタッフシフト管理</h1>
      {/* 非nullアサーション (!) を追加してエラーを解消 */}
      <p>ようこそ、{staff!.display_name}さん。</p>
      <p>あなたのID: {staff!.id}</p>
      <p>LINE ID: {staff!.line_id}</p>
      {/* ここにシフト表示ロジックを実装予定 */}
      <div className="mt-4 p-3 bg-gray-100 rounded">
        <h2 className="font-semibold">LIFF/LINE プロフィール情報</h2>
        <p>表示名: {lineProfile?.displayName}</p>
        <p>ユーザーID: {lineProfile?.userId}</p>
      </div>
=======
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
>>>>>>> 60a439bdc8025bc5fe07d410b87c746a7133d976
    </div>
  );
}