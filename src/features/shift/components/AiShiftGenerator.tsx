"use client";

import { useState } from "react";
import { generateAiShiftAction, GenerateShiftResult } from "../actions";
import { ShiftEntry, ValidationIssue } from "../types";

export function AiShiftGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateShiftResult | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    
    // テスト用に現在の日付から1週間分を指定（本来はカレンダー等から取得）
    const startDate = "2025-02-01T00:00:00Z";
    const endDate = "2025-02-07T23:59:59Z";

    try {
      const res = await generateAiShiftAction(startDate, endDate);
      setResult(res);
    } catch (e) {
      setResult({ success: false, error: "通信エラーが発生しました。" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white rounded-xl shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">AIシフト生成プロセッサー</h2>
          <p className="text-sm text-gray-500">労基法・店舗ルールを遵守したシフトを自動生成します</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`px-6 py-2 rounded-lg font-medium text-white transition-all ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
          }`}
        >
          {loading ? "AIが思考中..." : "AIシフトを生成する"}
        </button>
      </div>

      {/* エラー表示 */}
      {result?.error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {result.error}
        </div>
      )}

      {/* バリデーション警告表示（ガードレール） */}
      {result?.violations && result.violations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2">
            ⚠️ 以下の制約違反が検出されました
          </h3>
          <ul className="space-y-2">
            {result.violations.map((v, i) => (
              <li key={i} className={`p-3 text-sm rounded border ${
                v.level === 'ERROR' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <span className="font-bold">[{v.code}]</span> {v.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* シフトプレビュー表示 */}
      {result?.data && (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 font-semibold text-gray-600">スタッフID</th>
                <th className="p-3 font-semibold text-gray-600">開始時間</th>
                <th className="p-3 font-semibold text-gray-600">終了時間</th>
                <th className="p-3 font-semibold text-gray-600">役割</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.data.map((shift, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{shift.staff_id.slice(0, 8)}...</td>
                  <td className="p-3">{new Date(shift.start_at).toLocaleString('ja-JP')}</td>
                  <td className="p-3">{new Date(shift.end_at).toLocaleString('ja-JP')}</td>
                  <td className="p-3">{shift.role || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}