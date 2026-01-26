'use client';

import React, { useState, useTransition } from 'react';
import { getMentalPrescription } from './actions';

export default function SanctuaryPage() {
  const [prescription, setPrescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAnalyze = () => {
    setError(null);
    startTransition(async () => {
      const result = await getMentalPrescription();
      if (result.error) {
        setError(result.error);
      } else if (result.prescription) {
        setPrescription(result.prescription);
      }
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">店長の聖域</h1>
        <p className="text-slate-500 text-sm mt-1">
          AIが組織の「心のバイタル」を診断します。スタッフのプライバシーは完全に守られ、店長には改善のヒントのみが提示されます。
        </p>
      </header>

      {!prescription && !isPending && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <p className="text-slate-600 mb-6 text-center">
            最新のログを分析して、組織の健康診断レポートを生成しますか？<br />
            <span className="text-xs text-slate-400">※分析には数十秒かかる場合があります。</span>
          </p>
          <button
            onClick={handleAnalyze}
            className="px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            診断を開始する
          </button>
        </div>
      )}

      {isPending && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-600 animate-pulse">AIがログを復号・分析中...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg mb-6">
          {error}
        </div>
      )}

      {prescription && !isPending && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="font-bold text-indigo-900">AI組織健康診断レポート</h2>
              <button 
                onClick={handleAnalyze}
                className="text-xs text-indigo-600 hover:underline"
              >
                再分析
              </button>
            </div>
            <div className="p-6 prose prose-slate max-w-none">
              {/* 改行を反映して表示 */}
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {prescription}
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs text-amber-800 leading-5">
              <strong>【店長へのガイドライン】</strong><br />
              このレポートはAIによる推論に基づいています。特定の個人を問い詰めたり、犯人探しをすることは、システムの信頼性を損ない、組織の心理的安全性を著しく低下させます。
              レポートを元にした「環境の改善」と「マイルドな声掛け」を心がけてください。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}