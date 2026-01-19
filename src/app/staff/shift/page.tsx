// src/app/staff/shift/page.tsx
'use client';

import { useLiff } from '@/components/providers/LiffProvider';
import React from 'react';

/**
 * スタッフ向けシフト申請ページ
 * LIFF認証とプロフィール情報を表示し、動作確認を行う。
 */
export default function StaffShiftPage() {
  const { isLiffInitialized, isLoggedIn, lineProfile, error } = useLiff();

  if (error) {
    return <div className="p-4 text-red-600">エラー: {error}</div>;
  }

  // LIFFの初期化完了を待つ間の表示
  if (!isLiffInitialized) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl font-bold">LIFFを初期化中...</div>
      </div>
    );
  }

  // 初期化完了後の表示
  return (
    <div className="p-4 max-w-md mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Project SEED - シフト申請
      </h1>

      <div className="space-y-2 text-sm">
        <p className="font-semibold text-gray-600">LIFF ステータス:</p>
        <p>初期化完了: <span className={`font-bold ${isLiffInitialized ? 'text-green-600' : 'text-red-600'}`}>{isLiffInitialized.toString()}</span></p>
        <p>LINE ログイン済み: <span className={`font-bold ${isLoggedIn ? 'text-green-600' : 'text-yellow-600'}`}>{isLoggedIn.toString()}</span></p>
      </div>
      
      {isLoggedIn && lineProfile ? (
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-800">
          <p className="font-semibold mb-1">LINE プロフィール情報 (LIFF 認証成功):</p>
          <p>表示名: {lineProfile.displayName}</p>
          <p>ユーザーID (一部): {lineProfile.userId ? lineProfile.userId.substring(0, 10) + '...' : '取得不可'}</p>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800">
          <p>LINEにログインしていません。LIFFブラウザ内でのアクセスを推奨します。</p>
        </div>
      )}

      <div className="mt-6">
        <p className="text-lg font-semibold text-gray-800">
          この下にシフト入力フォームが入ります。
        </p>
      </div>
    </div>
  );
}