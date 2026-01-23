import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeStaffSentiment(userMessage: string) {
  // リストの中で最も安定かつ高速なモデルを指定
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash", 
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    あなたは飲食店の「AI副操縦士」です。
    以下のスタッフからのメッセージを分析し、必ずJSON形式で回答してください。

    スタッフからのメッセージ: "${userMessage}"

    【出力フォーマット】
    {
      "reply": "スタッフへの返信メッセージ",
      "category": "人間関係 / 設備 / 給与 / オペレーション / その他",
      "impact": 1-10の数値,
      "summary": "20文字以内の要約",
      "prescription": "経営者への改善策"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // デバッグ用にログ出力（Vercelで確認可能）
    console.log("Gemini Raw Response:", text);
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}