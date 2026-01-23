import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeStaffSentiment(userMessage: string) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-lite-preview-02-05", // 最新の高速モデル
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    ${process.env.SYSTEM_PROMPT_OVERRIDE || ""} 
    スタッフからのメッセージ: "${userMessage}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      reply: "ごめん、ちょっと今考えがまとまらなくて…。でも君の味方だよ。",
      category: "ERROR",
      impact: 0,
      summary: "システムエラー",
      prescription: "システム管理者へ連絡してください"
    };
  }
}