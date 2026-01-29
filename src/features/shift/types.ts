import { z } from "zod";

// --- Policies ---

export const RestRuleSchema = z.object({
  work_hours_threshold: z.number().default(6),
  rest_minutes: z.number().default(45),
});

// 店舗ポリシー：全体設定（各項目に .default を適用して欠損に強くする）
export const StorePolicySchema = z.object({
  consecutive_work_limits: z.object({
    max_days: z.number().default(6),
  }).default({ max_days: 6 }), // オブジェクト自体がなくてもデフォルトを適用
  
  rest_rules: z.array(RestRuleSchema).default([
    { work_hours_threshold: 6, rest_minutes: 45 },
    { work_hours_threshold: 8, rest_minutes: 60 },
  ]),
  
  interval_rules: z.object({
    min_interval_hours: z.number().default(11),
  }).default({ min_interval_hours: 11 }), // オブジェクト自体がなくてもデフォルトを適用
});

// スタッフ個別ポリシー
export const StaffPolicySchema = z.object({
  max_hours: z.number().describe("週単位の労働時間上限"),
  midnight_work: z.boolean().describe("深夜勤務(22:00-05:00)の可否"),
  consecutive_days: z.number().describe("個別設定の連勤上限"),
});

// --- AI Output (Shift Draft) ---

export const ShiftEntrySchema = z.object({
  staff_id: z.string().uuid(),
  start_at: z.string().datetime().describe("ISO 8601 UTC形式"),
  end_at: z.string().datetime().describe("ISO 8601 UTC形式"),
  role: z.string().optional(),
});

export const ShiftDraftSchema = z.object({
  shifts: z.array(ShiftEntrySchema),
});

// --- Validation Result ---

export type ValidationIssue = {
  level: "ERROR" | "WARNING";
  staff_id: string;
  date?: string;
  message: string;
  code: "MAX_HOURS_EXCEEDED" | "MIDNIGHT_WORK_VIOLATION" | "CONSECUTIVE_DAYS_EXCEEDED" | "INTERVAL_VIOLATION" | "OFF_REQUEST_CONFLICT" | "REST_TIME_SHORTAGE";
};

// 型抽出
export type StorePolicy = z.infer<typeof StorePolicySchema>;
export type StaffPolicy = z.infer<typeof StaffPolicySchema>;
export type ShiftEntry = z.infer<typeof ShiftEntrySchema>;
export type ShiftDraft = z.infer<typeof ShiftDraftSchema>;