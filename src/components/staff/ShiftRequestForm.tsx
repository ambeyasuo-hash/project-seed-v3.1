'use client'

import React, { useState } from 'react'
import { useStaffShift } from './StaffShiftContext'
import { createManualClient } from '@/lib/manual-db'

interface ShiftRequestFormProps {
  manualClient: ReturnType<typeof createManualClient>
}

export default function ShiftRequestForm({ manualClient }: ShiftRequestFormProps) {
  const { staffContext, isLoading } = useStaffShift()
  const [shiftDate, setShiftDate] = useState('')
  const [shiftTime, setShiftTime] = useState('')
  const [notes, setNotes] = useState('')
  const [isAbsent, setIsAbsent] = useState(false)
  const [message, setMessage] = useState('')

  if (isLoading) {
    return <div className="p-4">スタッフ情報を取得中...</div>
  }

  if (!staffContext) {
    return <div className="p-4 text-red-500">スタッフ情報が見つかりませんでした。LINE IDが登録されていません。</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('送信中...')

    const payload = {
      staff_uuid: staffContext.staff.id,
      request_date: shiftDate,
      start_time: shiftTime,
      notes: notes,
      is_absent: isAbsent,
      status: 'pending',
    }

    const { error } = await manualClient
      .from('shift_requests')
      .insert(payload as any) // Supabase Type Bypass

    if (error) {
      console.error('シフトリクエスト送信エラー:', error)
      setMessage(`送信失敗: ${error.message}`)
    } else {
      setMessage('シフトリクエストが正常に送信されました。')
      // フォームをリセット
      setShiftDate('')
      setShiftTime('')
      setNotes('')
      setIsAbsent(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">シフト提出フォーム</h1>
      <p className="mb-4">ようこそ、{staffContext.staff.display_name}さん。</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="shiftDate" className="block text-sm font-medium text-gray-700">希望日</label>
          <input
            type="date"
            id="shiftDate"
            value={shiftDate}
            onChange={(e) => setShiftDate(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label htmlFor="shiftTime" className="block text-sm font-medium text-gray-700">希望時間 (例: 10:00-15:00)</label>
          <input
            type="text"
            id="shiftTime"
            value={shiftTime}
            onChange={(e) => setShiftTime(e.target.value)}
            required={!isAbsent}
            disabled={isAbsent}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-100"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAbsent"
            checked={isAbsent}
            onChange={(e) => setIsAbsent(e.target.checked)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
          <label htmlFor="isAbsent" className="ml-2 block text-sm text-gray-900">この日は休みを希望</label>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">備考</label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <button
          type="submit"
          disabled={!shiftDate || (!shiftTime && !isAbsent)}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
        >
          シフトを提出
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-center text-green-600">{message}</p>}
    </div>
  )
}