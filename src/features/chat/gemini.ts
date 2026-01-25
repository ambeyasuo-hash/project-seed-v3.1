import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeStaffSentiment(userMessage: string) {
  // モデル名の指定（gemini-2.0-flash または gemini-1.5-flash）
  // ※制限が厳しい場合は 1.5-flash への変更を検討してください
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: { 
      responseMimeType: "application/json",
      temperature: 0.1 
    }
  });

  const prompt = `
    飲食店スタッフのメンタルケアと組織改善のアドバイザーとして、以下の発言を分析してください。
    
    発言: "${userMessage}"

    必ず以下のJSONフォーマットで返してください。
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
    const response = await result.response;
    let text = response.text();
    
    // デバッグログ: AIの生の応答をVercelログに記録（原因特定のため）
    console.log("Gemini Raw Response:", text);

    // JSON以外の文字（Markdownの枠など）が混じっている場合のクリーニング
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(text);

    return {
      reply: parsed.reply || "お疲れ様です。現場の声をしっかり受け止めました。",
      category: parsed.category || "その他",
      impact: Number(parsed.impact) || 5,
      summary: parsed.summary || "メッセージ受信",
      prescription: parsed.prescription || "継続的なモニタリングを推奨します"
    };

  } catch (error: any) {
    // Vercelのログに詳細なエラー内容を出力
    console.error("Gemini System Error:", {
      message: error.message,
      stack: error.stack,
      status: error?.status // API制限（429）などのステータス確認
    });

    // ユーザーへの返信（エラー時）
    return {
      reply: "（現在、AI副操縦士が一時的に混み合っております。少し時間を置いてから再度お声がけください）", 
      category: "エラー",
      impact: 0,
      summary: "API接続エラー",
      prescription: "APIクォータ制限または通信エラーを確認してください"
    };
  }
}