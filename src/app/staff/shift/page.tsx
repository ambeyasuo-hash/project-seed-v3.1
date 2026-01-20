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
    </div>
  );
}