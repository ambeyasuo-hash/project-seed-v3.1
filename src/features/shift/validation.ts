import { ShiftEntry, StaffPolicy, StorePolicy, ValidationIssue } from "./types";
import { parseISO, differenceInHours, differenceInMinutes, isWithinInterval, startOfWeek, endOfWeek, addDays, format } from "date-fns";

/**
 * シフトデータのバリデーション実行
 */
export const validateShifts = (
  shifts: ShiftEntry[],
  staffPolicies: Record<string, StaffPolicy>, // staff_id をキーとする
  storePolicy: StorePolicy,
  // offRequests?: any[] // 今回は基本バリデーションに集中
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  // 1. スタッフごとにグループ化
  const shiftsByStaff = shifts.reduce((acc, shift) => {
    if (!acc[shift.staff_id]) acc[shift.staff_id] = [];
    acc[shift.staff_id].push(shift);
    return acc;
  }, {} as Record<string, ShiftEntry[]>);

  Object.entries(shiftsByStaff).forEach(([staffId, staffShifts]) => {
    const policy = staffPolicies[staffId];
    
    // 日時順にソート
    const sortedShifts = [...staffShifts].sort(
      (a, b) => parseISO(a.start_at).getTime() - parseISO(b.start_at).getTime()
    );

    // --- 制約チェック: 週合計時間 ---
    const weeklyHours = calculateWeeklyHours(sortedShifts);
    Object.entries(weeklyHours).forEach(([weekStart, hours]) => {
      const limit = policy?.max_hours ?? 40; // デフォルト40h
      if (hours > limit) {
        issues.push({
          level: "ERROR",
          staff_id: staffId,
          message: `週間労働時間が上限(${limit}h)を超過しています: ${hours.toFixed(1)}h`,
          code: "MAX_HOURS_EXCEEDED",
        });
      }
    });

    // --- 制約チェック: 深夜勤務 ---
    if (policy?.midnight_work === false) {
      sortedShifts.forEach(shift => {
        if (isMidnightWork(shift)) {
          issues.push({
            level: "ERROR",
            staff_id: staffId,
            date: format(parseISO(shift.start_at), "yyyy-MM-dd"),
            message: "深夜勤務禁止設定ですが、22:00-05:00の間に勤務が含まれています。",
            code: "MIDNIGHT_WORK_VIOLATION",
          });
        }
      });
    }

    // --- 制約チェック: 勤務間インターバル ---
    for (let i = 0; i < sortedShifts.length - 1; i++) {
      const currentEnd = parseISO(sortedShifts[i].end_at);
      const nextStart = parseISO(sortedShifts[i+1].start_at);
      const interval = differenceInHours(nextStart, currentEnd);
      
      const minInterval = storePolicy.interval_rules.min_interval_hours;
      if (interval < minInterval) {
        issues.push({
          level: "WARNING",
          staff_id: staffId,
          date: format(nextStart, "yyyy-MM-dd"),
          message: `勤務間インターバルが不足しています（最低${minInterval}hに対し、現在${interval.toFixed(1)}h）`,
          code: "INTERVAL_VIOLATION",
        });
      }
    }
  });

  return issues;
};

// --- Helper Functions ---

function calculateWeeklyHours(shifts: ShiftEntry[]): Record<string, number> {
  const weeklyTotal: Record<string, number> = {};
  shifts.forEach(shift => {
    const start = parseISO(shift.start_at);
    const end = parseISO(shift.end_at);
    const hours = differenceInMinutes(end, start) / 60;
    
    const weekKey = format(startOfWeek(start, { weekStartsOn: 1 }), "yyyy-MM-dd");
    weeklyTotal[weekKey] = (weeklyTotal[weekKey] || 0) + hours;
  });
  return weeklyTotal;
}

function isMidnightWork(shift: ShiftEntry): boolean {
  const start = parseISO(shift.start_at);
  const end = parseISO(shift.end_at);
  
  // 簡易判定: 22:00 - 05:00 に重なっているか
  const startHour = start.getUTCHours();
  const endHour = end.getUTCHours();
  
  // UTCでの判定になるため、運用環境のタイムゾーンに合わせる必要がありますが、
  // ロジックの骨格として「22時以降または5時以前」をチェック
  return (startHour >= 22 || startHour < 5 || endHour > 22 || endHour <= 5);
}