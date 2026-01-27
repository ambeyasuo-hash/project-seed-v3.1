'use client'

import { useState } from 'react'
import { generateShiftDraft } from '@/features/shift/actions'

export default function ShiftGenPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      // 2025年2月分をテスト対象とする
      const res = await generateShiftDraft('2025-02')
      setResult(res)
    } catch (e) {
      setResult('Error: ' + String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">AIシフト生成プロトタイプ</h1>
      <button 
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? '生成中...' : '2025-02のシフトを生成'}
      </button>
      <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-[500px] text-sm">
        {result || '結果はここに表示されます'}
      </pre>
    </div>
  )
}