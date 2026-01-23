import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeStaffSentiment(userMessage: string) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: { 
      responseMimeType: "application/json",
      temperature: 0.1 // 回答を安定させるために低めに設定
    }
  });

  const prompt = `
    飲食店スタッフのメンタルケアと組織改善のアドバイザーとして、以下の発言を分析してください。
    
    発言: "${userMessage}"

    必ず以下のJSONフォーマットで返してください。他の文字は一切不要です。
    {
      "reply": "スタッフへの共感メッセージ",
      "category": "人間関係/設備/給与/オペレーション/その他",
      "impact": 1から10の数値,
      "summary": "20文字以内の要約",
      "prescription": "経営者への具体的な改善案"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // DBのカラム名と確実に一致させるためのマッピング
    return {
      reply: parsed.reply || "お疲れ様です。応援していますよ。",
      category: parsed.category || "その他",
      impact: Number(parsed.impact) || 5, // 確実に数値化
      summary: parsed.summary || "メッセージ受信",
      prescription: parsed.prescription || "継続的な対話が必要です"
    };
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return {
      reply: "ごめんなさい、ちょっと調子が悪いみたい。でも君の味方だよ。",
      category: "ERROR",
      impact: 0,
      summary: "解析失敗",
      prescription: "システムエラーが発生しました"
    };
  }
}