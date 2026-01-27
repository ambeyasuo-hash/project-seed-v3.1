'use server';

import { createMainClient } from '@/lib/db/server';
import { decrypt } from '@/utils/crypto';
import { getAiResponse } from '@/lib/ai/gemini';

const HARDCODED_TENANT_ID = 'db86e974-90a4-471a-b0f3-94c0429f635c';

export async function getMentalPrescription() {
  const supabase = await createMainClient();

  // 1. 複数のソースからデータを並行取得
  const [logsResult, aiLogsResult] = await Promise.all([
    // 心理的ログ（暗号化メッセージ）
    supabase
      .from('logs')
      .select('content_encrypted, category, created_at, impact')
      .eq('tenant_id', HARDCODED_TENANT_ID)
      .order('created_at', { ascending: false })
      .limit(30),
    // AIイベントログ（ボットの稼働状況や対話イベント）
    supabase
      .from('ai_logs')
      .select('event_type, payload, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  // 2. データの整形と復号
  const mentalData = (logsResult.data || []).map(log => {
    try {
      const decrypted = log.content_encrypted ? decrypt(log.content_encrypted) : null;
      return decrypted ? `[${log.created_at}] カテゴリ:${log.category || '不明'} (影響度:${log.impact}): ${decrypted}` : null;
    } catch (e) { return null; }
  }).filter(Boolean);

  const botEvents = (aiLogsResult.data || []).map(event => {
    return `[${event.created_at}] イベント:${event.event_type} - 内容:${JSON.stringify(event.payload)}`;
  });

  if (mentalData.length === 0 && botEvents.length === 0) {
    return { error: '分析に十分なデータが蓄積されていません。' };
  }

  // 3. AIへのリッチなプロンプト
  const analysisPrompt = `
あなたは高度な組織心理アナリストです。以下の「スタッフの生の声」と「ボット稼働ログ」を統合分析してください。

### 分析の目的
店長に対し、個人のプライバシーを完全に守った上で、店舗全体の「心理的安全性」と「離職リスク」を可視化し、具体的な改善策を提案すること。

### 入力データ
---
【スタッフの生の声（復号済み）】
${mentalData.join('\n')}

【ボット稼働・対話イベント】
${botEvents.join('\n')}
---

### 出力指示（店長向けレポート）
1. **組織のバイタルスコア**: 活気、疲労度、不満度を100点満点で数値化。
2. **主要な「痛みの兆候」**: 現場で今何が起きているか、抽象化して3点以内で。
3. **AI処方箋**: 店長が今すぐ、あるいは来週から行うべき具体的な声掛けや環境改善案。
4. **スタッフへのフィードバック案**: スタッフ全員に向けて「みんなの声をこう受け止めて改善に動いているよ」と伝えるためのマイルドなメッセージ案。

※注意：生々しい発言内容は、必ず「〇〇という傾向がある」といった表現に変換し、特定の個人が特定されないよう厳重に配慮してください。
`;

  try {
    const prescription = await getAiResponse(analysisPrompt);
    return { prescription };
  } catch (e) {
    return { error: 'AI分析中にエラーが発生しました。' };
  }
}