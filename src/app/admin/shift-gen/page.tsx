'use client'

import { useState } from 'react'
import { generateAiShiftAction, saveShiftDraft, GenerateShiftResult } from '@/features/shift/actions'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default function ShiftGenPage() {
  const [res, setRes] = useState<GenerateShiftResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [targetMonth, setTargetMonth] = useState(format(new Date(), 'yyyy-MM')) 

  // AIシフト生成実行 (Phase 8 高精度版)
  const handleGenerate = async () => {
    setLoading(true)
    setRes(null)
    try {
      // 選択された月の開始日と終了日を ISO UTC 形式で生成
      const date = new Date(`${targetMonth}-01T00:00:00Z`)
      const startDate = startOfMonth(date).toISOString()
      const endDate = endOfMonth(date).toISOString()

      const result = await generateAiShiftAction(startDate, endDate)
      setRes(result)
    } catch (e) {
      alert('システムエラー: ' + String(e))
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
        setRes(null)
      } else {
        alert('保存失敗: ' + result.error)
      }
    } catch (e) {
      alert('システムエラー: ' + String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AIシフトジェネレーター v3.2</h1>
          <p className="text-gray-500">労基法・店舗ポリシーの自動検閲エンジン搭載</p>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-white border rounded-xl shadow-sm">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">対象月</label>
            <input 
              type="month" 
              value={targetMonth} 
              onChange={(e) => setTargetMonth(e.target.value)}
              className="border-none text-lg font-semibold focus:ring-0 p-0"
            />
          </div>
          <div className="h-10 w-px bg-gray-200 mx-2" />
          <button 
            onClick={handleGenerate}
            disabled={loading || saving}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 transition-all shadow-md shadow-indigo-100"
          >
            {loading ? 'AI思考中...' : 'AIシフト生成'}
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {res?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-xl">
          {res.error}
        </div>
      )}

      {/* ガードレール：バリデーション警告（ここが Phase 8 の肝） */}
      {res?.violations && res.violations.length > 0 && (
        <div className="mb-8 space-y-3">
          <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2">
            ⚠️ 以下の制約違反が検出されました（要確認）
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {res.violations.map((v, i) => (
              <div key={i} className={`p-3 text-sm rounded-lg border flex flex-col ${
                v.level === 'ERROR' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-amber-50 border-amber-100 text-amber-800'
              }`}>
                <span className="font-bold text-xs opacity-70">[{v.code}]</span>
                <span>{v.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* シフトプレビュー & 保存ボタン */}
      {res?.data && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-gray-700">生成されたシフト案 ({res.data.length}件)</h2>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-300 transition-all shadow-md shadow-emerald-100"
            >
              {saving ? '保存中...' : 'この内容で確定・保存'}
            </button>
          </div>

          <div className="overflow-hidden border border-gray-100 rounded-xl shadow-sm bg-white">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-600">日付</th>
                  <th className="px-6 py-4 font-bold text-gray-600">時間</th>
                  <th className="px-6 py-4 font-bold text-gray-600">スタッフID</th>
                  <th className="px-6 py-4 font-bold text-gray-600">役割</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {res.data.map((item, i) => (
                  <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {format(new Date(item.start_at), 'yyyy/MM/dd (E)', { locale: require('date-fns/locale/ja') })}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {format(new Date(item.start_at), 'HH:mm')} - {format(new Date(item.end_at), 'HH:mm')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                      {item.staff_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                        {item.role || 'Member'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}