// src/app/staff/shift/page.tsx

'use client'

import { useLiff } from '@/components/providers/LiffProvider'
import React, { useState, useEffect } from 'react'
import { getStaffByLineId } from '@/app/staff/actions' // スタッフ情報取得
import { submitShiftRequest } from './actions.ts'; // シフト申請アクション
import type { Database } from '@/types/database'

// staffテーブルの型を抽出
type StaffRow = Database['public']['Tables']['staff']['Row']
// フォームデータ管理用の型を Database 型から直接定義
type ShiftRequestFormData = Omit<Database['public']['Tables']['shift_requests']['Insert'], 'id' | 'is_approved' | 'created_at'>;

// LiffProvider.tsx で定義済みの型を再定義
interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

/**
 * スタッフ向けシフト申請ページ
 */
export default function StaffShiftPage() {
  // SEED v3.1 仕様のプロパティ名を使用
  const { liff, isLiffInitialized, isLoggedIn, lineProfile, error } = useLiff()
  
  const [staffData, setStaffData] = useState<StaffRow | null>(null) // DBから取得したスタッフ情報
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthorized' | 'authorized'>('loading')
  
  // フォーム関連のStateを再定義
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // フォームデータ管理用のState
  const [formData, setFormData] = useState<Omit<ShiftRequestFormData, 'staff_id'>>({
    request_date: new Date().toISOString().split('T')[0], // DBスキーマに合わせて request_date に修正
    start_time: '10:00:00',
    end_time: '19:00:00',
    notes: '',
    priority_weight: 50, // DBスキーマに合わせて priority_weight を追加
    is_absent: false, // DBスキーマに合わせて is_absent を追加
  });

  useEffect(() => {
    if (isLiffInitialized && liff && isLoggedIn && lineProfile?.userId && authStatus === 'loading') {
      const userId = lineProfile.userId

      // 2. スタッフ情報取得のサーバーアクション呼び出し
      getStaffByLineId(userId).then(result => {
        if ('success' in result) {
          setStaffData(result.staff)
          setAuthStatus('authorized')
          console.log('Staff Authorized:', result.staff)
        } else {
          setAuthStatus('unauthorized')
          console.error('Staff Unauthorized:', result.error)
        }
      })
    }
    // LIFFが未初期化、未ログイン、またはエラーの場合は、認証状態を更新
    if (isLiffInitialized && (!isLoggedIn || !lineProfile?.userId) && authStatus === 'loading') {
        setAuthStatus('unauthorized');
    }
  }, [isLiffInitialized, liff, isLoggedIn, lineProfile, authStatus])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    // 型推論に任せる (正しい型定義が生成されていればエラーは出ない)
    setFormData(prev => ({ 
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'priority_weight' ? parseInt(value, 10) : value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffData) return; // スタッフデータがない場合は送信不可

    setIsSubmitting(true);
    setMessage(null);

    // 必須データの組み合わせ
    const payload: ShiftRequestFormData = {
      ...formData,
      staff_id: staffData.id, // DBから取得したスタッフIDを使用
    };

    try {
      const result = await submitShiftRequest(payload);

      // ★ 型ガード
      if ('success' in result) { 
        setMessage({ type: 'success', text: 'シフト希望が正常に送信されました。' });
      } else {
        setMessage({ type: 'error', text: `送信失敗: ${result.error}` });
      }
    } catch (e) {
      setMessage({ type: 'error', text: '通信エラーが発生しました。' });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (error) {
    return <div className="p-4 text-red-600">LIFFエラー: {error}</div>;
  }

  if (!isLiffInitialized || authStatus === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl font-bold">LIFF初期化とスタッフ情報を確認中...</div>
      </div>
    );
  }

  // LINEログイン済みだが、DBにスタッフ情報がない場合
  if (authStatus === 'unauthorized') {
    return (
        <div className="p-4 max-w-md mx-auto bg-white shadow-lg rounded-lg mt-10">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">シフト申請</h1>
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                <p className="font-bold">アクセス拒否</p>
                <p>スタッフ情報が見つかりません。あなたのLINE ID ({lineProfile?.userId?.substring(0, 8)}...) は名簿に登録されていません。</p>
            </div>
        </div>
    );
  }

  // 認証済みの場合のUI
  return (
    <div className="p-4 max-w-md mx-auto bg-white shadow-lg rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        シフト申請
      </h1>

      <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-800 text-sm">
          <p>ようこそ、**{staffData?.display_name}** さん</p>
          <p className="text-xs text-blue-600">スタッフID: {staffData?.id.substring(0, 8)}...</p>
      </div>

      {message && (
        <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="request_date" className="block text-sm font-medium text-gray-700">希望日付</label>
          <input
            type="date"
            id="request_date"
            name="request_date"
            required
            value={formData.request_date}
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

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="priority_weight" className="block text-sm font-medium text-gray-700">希望の重み (1-100)</label>
            <input
              type="number"
              id="priority_weight"
              name="priority_weight"
              min="1"
              max="100"
              required
              value={formData.priority_weight}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
          <div className="flex items-center pt-5">
            <input
              id="is_absent"
              name="is_absent"
              type="checkbox"
              checked={formData.is_absent}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="is_absent" className="ml-2 block text-sm text-gray-900">この日は休みたい</label>
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
          disabled={isSubmitting || !staffData}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white font-semibold ${
            isSubmitting || !staffData
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