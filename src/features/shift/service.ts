import "server-only";
import { supabaseManual as supabase } from "@/utils/supabase";
import { 
  ShiftEntry, 
  StorePolicy, 
  StaffPolicy, 
  StorePolicySchema, 
  ShiftDraftSchema, 
  ValidationIssue 
} from "./types";
import { validateShifts } from "./validation";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * プロジェクト共通定数
 * ※ 本来は環境変数やセッションから取得すべきですが、
 *    現在は Manual DB の固定テナントIDを使用します。
 */
const TENANT_ID = "e97e2f12-f705-40d1-9304-63304918e77c";

// AIクライアントの初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
  }
});

/**
 * Supabaseのリレーションを含む型定義
 */
interface StaffWithPolicy {
  id: string;
  name: string;
  role: string;
  staff_policies: {
    max_hours: number;
    midnight_work: boolean;
    consecutive_days: number;
  }[];
}

/**
 * 1. コンテキスト・アグリゲーター (The Input)
 * AIに「現場の状況」を完璧に伝えるための高密度データパックを作成する
 */
export async function prepareGenerationContext(startDate: string, endDate: string) {
    // 1. 店舗ポリシーの取得
    const { data: storePolicyData } = await supabase
      .from("store_policies")
      .select("*")
      .eq("tenant_id", TENANT_ID)
      .single();
  
    // DBのデータが null または 期待するキーを持っていない場合に備えてパース
    // .catch() を入れることで、万が一のパースエラーでもシステムを止めずデフォルトを返す
    const storePolicy = StorePolicySchema.parse(storePolicyData || {});

  // 1.2 スタッフ一覧と個別ポリシーの取得
  const { data: rawStaffData } = await supabase
    .from("staff_data")
    .select(`
      id,
      name,
      role,
      staff_policies (
        max_hours,
        midnight_work,
        consecutive_days
      )
    `)
    .eq("tenant_id", TENANT_ID);

  const staffWithPolicies = (rawStaffData as unknown as StaffWithPolicy[]) || [];

  // 1.3 希望休の取得
  const { data: offRequests } = await supabase
    .from("off_requests")
    .select("staff_id, date, request_type")
    .eq("tenant_id", TENANT_ID)
    .gte("date", startDate)
    .lte("date", endDate);

  // 1.4 コンテキストの集約
  return {
    period: { start: startDate, end: endDate },
    store_policy: storePolicy,
    staffs: staffWithPolicies.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      policy: s.staff_policies?.[0] || null
    })),
    constraints: {
      off_requests: offRequests || []
    }
  };
}

/**
 * 2. 生成・検証フロー (The Orchestrator)
 * AIシフト生成を実行し、即座にバリデーションエンジンで検閲する
 */
export async function generateAndValidateShift(startDate: string, endDate: string) {
  try {
    // 2.1 コンテキスト収集
    const context = await prepareGenerationContext(startDate, endDate);

    // 2.2 プロンプト構築 (The Soul)
    const prompt = `
あなたは、高度な労務知識を持つAIシフトマネージャーです。
以下の「店舗ポリシー」「スタッフ制約」「希望休」をすべて遵守し、最適なシフトを作成してください。

### 1. 入力データ (Context)
${JSON.stringify(context, null, 2)}

### 2. 絶対遵守ルール (Hard Constraints)
- 各スタッフの weekly_hours 上限（週単位の合計労働時間）を1分でも超えてはならない。
- 深夜勤務 (22:00 - 05:00 UTC) が禁止されているスタッフには、その時間帯のシフトを割り当てない。
- 希望休「×」の日は、絶対にシフトを割り当てない。
- 店舗ポリシーの「連勤上限 (max_days)」を遵守すること。
- 勤務間インターバル (min_interval_hours) を確保すること。

### 3. 最適化目標 (Soft Constraints)
- 希望休「△」は、可能な限り避けるが、人員不足の場合は最小限の割り当てを検討せよ。
- スタッフ間の公平性を保ち、特定のスタッフに負担を集中させないこと。

### 4. 出力形式 (Output Format)
以下のJSON形式で回答せよ。
{
  "shifts": [
    {
      "staff_id": "UUID",
      "start_at": "ISO 8601 UTC形式",
      "end_at": "ISO 8601 UTC形式",
      "role": "役割名"
    }
  ]
}
`;

    // 2.3 AI生成実行
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // 2.4 Zodによる型検証 (ハルシネーションの遮断)
    const rawData = JSON.parse(responseText);
    const validatedDraft = ShiftDraftSchema.parse(rawData);

    // 2.5 ロジックによる自己検証 (Self-Validation)
    const staffPolicyRecord: Record<string, StaffPolicy> = {};
    context.staffs.forEach(s => {
      if (s.policy) staffPolicyRecord[s.id] = s.policy;
    });

    const issues = validateShifts(
      validatedDraft.shifts,
      staffPolicyRecord,
      context.store_policy
    );

    // 2.6 結果の返却
    return {
      success: true,
      data: validatedDraft.shifts,
      violations: issues,
      context: {
        startDate,
        endDate
      }
    };

  } catch (error) {
    console.error("Shift Generation Protocol Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "シフト生成プロセスで予期せぬエラーが発生しました。",
      violations: [] as ValidationIssue[]
    };
  }
}