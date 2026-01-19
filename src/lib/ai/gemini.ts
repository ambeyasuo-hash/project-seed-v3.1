import { GoogleGenerativeAI } from "@google/generative-ai";
import { TECHNICAL_CONSTANTS } from "../constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const getAiResponse = async (prompt: string) => {
  const model = genAI.getGenerativeModel({ 
    model: TECHNICAL_CONSTANTS.MODEL_NAME 
  });

  const result = await model.generateContent([
    { text: TECHNICAL_CONSTANTS.SAFETY_PROMPT },
    { text: prompt }
  ]);
  
  const response = await result.response;
  return response.text();
};