'use client'

import { useState } from 'react'
import { generateShiftDraft, saveShiftDraft } from '@/features/shift/actions'

export default function ShiftGenPage() {
  const [res, setRes] = useState<{data: any[], violated: boolean} | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  // --- 追加: 月の選択状態 ---
  const [targetMonth, setTargetMonth] = useState('2025-02') 

  // AIシフト生成実行
  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await generateShiftDraft(targetMonth) // 固定値から変数へ
      setRes(result as any)
    } catch (e) {
      alert(String(e))
    } finally {
      setLoading(false)
    }
  }

  // データベースへの保存実行
  const handleSave = async () => {
    if (!res?.data) return
    setSaving(true)
    try {
      const result = await saveShiftDraft(res.data)
      if (result.success) {
        alert('シフトを正常に下書き保存しました。')
        setRes(null) // 保存後は表示をクリア
      } else {
        alert('保存失敗: ' + result.error)
      }
    } catch (e) {
      alert('システムエラー: ' + String(e))
    } finally {
      setSaving(false)
    }
  }

   // ... handleSave 内の alert 等も必要に応じて targetMonth を使うよう修正可能 ...

   return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">AIシフト生成プロトタイプ</h1>
      
      {/* --- 追加: 月選択インターフェース --- */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-xs text-gray-500 mb-1">対象月を選択</label>
          <input 
            type="month" 
            value={targetMonth} 
            onChange={(e) => setTargetMonth(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={handleGenerate}
          disabled={loading || saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'AIが思考中...' : '2025-02のシフトを生成'}
        </button>

        {res?.data && (
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {saving ? '保存中...' : 'この内容で下書き保存'}
          </button>
        )}
      </div>

      {res?.violated && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          ⚠️ 警告: AIが生成したシフトの中に、希望休（off_requests）と重複している箇所があります。
        </div>
      )}

      {res?.data && (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="min-w-full bg-white text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">日付</th>
                <th className="px-4 py-3 font-semibold">スタッフID (略)</th>
                <th className="px-4 py-3 font-semibold">役割</th>
                <th className="px-4 py-3 font-semibold">シフト種別</th>
              </tr>
            </thead>
            <tbody>
              {res.data.map((item: any, i: number) => (
                <tr key={i} className="border-b hover:bg-blue-50 transition">
                  <td className="px-4 py-2 font-mono">{item.date}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-400">
                    {item.staff_id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.role === 'leader' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{item.shift_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}