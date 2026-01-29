import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// 最新の gemini-2.0-flash-lite を指定
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-latest" });

export async function analyzeStaffSentiment(text: string) {
  const prompt = `
あなたは飲食店の店長を支える「AI副操縦士」です。
スタッフの「本音（叫び）」を分析し、以下のJSON形式で回答してください。

【制約事項】
1. JSON以外のテキストは一切含めないでください。
2. 返信はスタッフに寄り添いつつ、短く簡潔に（2-3行）。
3. 処方箋は店長向けの組織改善アクションです。

【出力フォーマット】
{
  "reply": "スタッフへの温かい返信",
  "category": "人間関係/設備/待遇/オペレーション/その他",
  "impact": 1から10の数値（深刻度）,
  "summary": "20文字以内の要約",
  "prescription": "店長への具体的アドバイス"
}

【スタッフの発言】
"${text}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let rawText = response.text();
    
    // Markdownの装飾を除去
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    
    // 配列で返ってきた場合は最初の要素を取得
    const aiData = Array.isArray(parsed) ? parsed[0] : parsed;

    return {
      reply: aiData.reply || "お疲れ様です。何か力になれることがあれば教えてくださいね。",
      category: aiData.category || "その他",
      impact: aiData.impact || 1,
      summary: aiData.summary || "内容不明",
      prescription: aiData.prescription || "特記事項なし"
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      reply: "お疲れ様です。少し落ち着いたら、またお話ししましょう。",
      category: "エラー",
      impact: 0,
      summary: "システムエラー",
      prescription: "API接続を確認してください"
    };
  }
}