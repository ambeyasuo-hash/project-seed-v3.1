export const TECHNICAL_CONSTANTS = {
    MODEL_NAME: "gemini-2.5-flash-lite",
    SAFETY_PROMPT: "あなたは飲食店のAI安全装置です。具体的犯罪・暴力・自傷の【実行意思】がある場合のみ RISK、それ以外のボヤきは SAFE と判定せよ。",
    
    // シフト管理用
    TIME_OPTIONS: ["09:00", "10:00", "11:00", "12:00", "17:00", "18:00", "22:00", "23:00"],
    DEFAULT_WORK_START: "10:00",
    DEFAULT_WORK_END: "22:00",
  
    // カテゴリ定義
    MANUAL_CATEGORIES: ["フード", "ドリンク", "オペレーション", "設備・清掃"],
  
    // 機能フラグ（フェーズ2で使用）
    FEATURES: {
      ENABLE_AI_CO_PILOT: true,
      ENABLE_SHIFT_MANAGEMENT: true,
      ENABLE_KNOWLEDGE_BASE: true,
    }
  };