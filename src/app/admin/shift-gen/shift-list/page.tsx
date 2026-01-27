// src/app/admin/shift-gen/shift-list/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { getShifts, deleteDraftShifts } from '@/features/shift/actions'

export default function ShiftListPage() {
  const [shifts, setShifts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const targetMonth = '2025-02'

  const fetchShifts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getShifts(targetMonth)
      setShifts(data)
    } catch (e) {
      alert('取得失敗')
    } finally {
      setLoading(false)
    }
  }, [targetMonth])

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  const handleDelete = async () => {
    if (!confirm('この月の下書きシフトをすべて削除しますか？')) return
    const res = await deleteDraftShifts(targetMonth)
    if (res.success) {
      alert('削除しました')
      fetchShifts()
    } else {
      alert('削除失敗: ' + res.error)
    }
  }

  if (loading) return <div className="p-8">読み込み中...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">保存済みシフト一覧 ({targetMonth})</h1>
        <button 
          onClick={handleDelete}
          className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200 text-sm font-bold"
        >
          下書きを一括削除
        </button>
      </div>
      
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full bg-white text-sm text-left">
          {/* ...テーブルヘッダーとボディは前回と同じ... */}
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2">日付</th>
              <th className="px-4 py-2">スタッフ名</th>
              <th className="px-4 py-2">時間</th>
              <th className="px-4 py-2">状態</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-mono">{shift.work_date}</td>
                <td className="px-4 py-2">{shift.staff_data?.display_name || '不明'}</td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                </td>
                <td className="px-4 py-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    {shift.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shifts.length === 0 && <p className="mt-4 text-gray-500">データがありません。</p>}
    </div>
  )
}