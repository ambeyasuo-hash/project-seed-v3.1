// src/app/staff/shift/page.tsx
'use client';

import { useLiff } from '@/components/providers/LiffProvider';
import React, { useState } from 'react';
// actions.server.ts から submitShiftRequest をインポート
import { submitShiftRequest } from './actions'; 
import type { Database } from '@/types/database';

// フォームデータ管理用の型を Database 型から直接定義
type ShiftRequestFormData = Omit<Database['public']['Tables']['shift_requests']['Insert'], 'id' | 'is_approved' | 'created_at'>;

/**
 * スタッフ向けシフト申請ページ
 */
export default function StaffShiftPage() {
  const { isLiffInitialized, isLoggedIn, lineProfile, error } = useLiff();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // フォームデータ管理用のState
  const [formData, setFormData] = useState<Omit<ShiftRequestFormData, 'staff_id'>>({
    shift_date: new Date().toISOString().split('T')[0],
    start_time: '10:00:00',
    end_time: '19:00:00',
    notes: '',
  });

  if (error) {
    return <div className="p-4 text-red-600">LIFFエラー: {error}</div>;
  }

  if (!isLiffInitialized) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl font-bold">LIFFを初期化中...</div>
      </div>
    );
  }

  // LIFFでログインしていない場合は、フォームを表示しない
  if (!isLoggedIn || !lineProfile || !lineProfile.userId) {
    return (
        <div className="p-4 max-w-md mx-auto bg-white shadow-lg rounded-lg mt-10">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">シフト申請</h1>
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                <p className="font-bold">アクセス拒否</p>
                <p>このページはLINEアプリ内のLIFFブラウザからのみアクセス可能です。外部ブラウザまたは未認証状態では利用できません。</p>
            </div>
            <p className="mt-4 text-sm text-gray-500">LIFF ログイン済み: {isLoggedIn.toString()}</p>
        </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // 必須データの組み合わせ
    const payload = {
      ...formData,
      staff_id: lineProfile.userId,
    };

    try {
      const result = await submitShiftRequest(payload);

      // ★ この if 文で result の型が { success: true } であると確定させる (型ガード)
      if ('success' in result) { 
        // 成功オブジェクトの場合、result.success にアクセス可能
        setMessage({ type: 'success', text: 'シフト希望が正常に送信されました。' });
      } else {
        // 失敗オブジェクトの場合、result.error にアクセス可能
        setMessage({ type: 'error', text: `送信失敗: ${result.error}` });
      }
    } catch (e) {
      setMessage({ type: 'error', text: '通信エラーが発生しました。' });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="p-4 max-w-md mx-auto bg-white shadow-lg rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        シフト申請
      </h1>

      <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-800 text-sm">
          <p>ようこそ、**{lineProfile.displayName}** さん</p>
          <p className="text-xs text-blue-600">LIFF User ID: {lineProfile.userId.substring(0, 8)}...</p>
      </div>

      {message && (
        <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="shift_date" className="block text-sm font-medium text-gray-700">希望日付</label>
          <input
            type="date"
            id="shift_date"
            name="shift_date"
            required
            value={formData.shift_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>

        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">開始時刻</label>
            <input
              type="time"
              id="start_time"
              name="start_time"
              required
              step="3600"
              value={formData.start_time.substring(0, 5)}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">終了時刻</label>
            <input
              type="time"
              id="end_time"
              name="end_time"
              required
              step="3600"
              value={formData.end_time.substring(0, 5)}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">備考</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            placeholder="特別な希望があれば記入してください"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isLoggedIn}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white font-semibold ${
            isSubmitting || !isLoggedIn
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
        >
          {isSubmitting ? '送信中...' : 'シフトを申請する'}
        </button>
      </form>
    </div>
  );
}