import { gatewayProxy } from '@/lib/proxy';
import { getAiStaffContext } from '@/lib/ai/context';
import { getAiResponse } from '@/lib/ai/gemini';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AiTestPage() {
  // Proxy Gateway を経由して AI 分析を実行
  const aiAnalysis = await gatewayProxy('ENABLE_AI_CO_PILOT', async () => {
    // 1. 聖域（匿名ビュー）からデータを取得
    const context = await getAiStaffContext();
    
    // 2. AIへのプロンプト作成（実名は含まれない）
    const prompt = `以下のスタッフデータ（匿名）を分析し、組織の現状を100文字以内で短評せよ。データ：${JSON.stringify(context)}`;
    
    // 3. Gemini API を呼び出し
    return await getAiResponse(prompt);
  });

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-slate-100 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-blue-400">AI エンジン結合テスト</h1>
          <p className="text-slate-400 text-sm">プロトコル：ai_copilot_reader ロールによる匿名参照</p>
        </header>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">AI 分析結果</h2>
          <p className="text-lg leading-relaxed text-slate-200">
            {aiAnalysis}
          </p>
        </div>

        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 mb-8">
          <p className="text-xs text-blue-300">
            ※この分析にはスタッフの実名や個人情報は一切使用されていません。
          </p>
        </div>

        <Link href="/admin" className="text-slate-500 hover:text-white transition text-sm">
          ← 管理者ダッシュボードへ戻る
        </Link>
      </div>
    </div>
  );
}