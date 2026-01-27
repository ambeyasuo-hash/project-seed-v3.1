'use server'

import { createManualClient } from '@/lib/db/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// --- 型定義 ---
type SubmitResult = { success: true } | { error: string }

// Gemini初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/**
 * スタッフからの希望休提出
 */
export async function submitShiftRequest(payload: any): Promise<SubmitResult> {
  const supabase = createManualClient()

  const { error } = await supabase
    .from('off_requests')
    .insert(payload)
    .select()

  if (error) {
    console.error('Error submitting shift request:', error)
    return { error: `シフト申請に失敗しました: ${error.message}` }
  }

  return { success: true }
}

/**
 * AIシフト案の生成 (Phase 6 Prototype)
 */
export async function generateShiftDraft(targetMonth: string) {
  const supabase = createManualClient()

  // 匿名化ビューからのデータ取得
  const { data: staffContext, error: staffError } = await supabase
    .from('ai_staff_context')
    .select('*')

  if (staffError) {
    console.error('Staff Fetch Error:', staffError)
    throw new Error(`スタッフデータ取得失敗: ${staffError.message}`)
  }

 // 指定月の初日と翌月の初日を算出
 const startOfMonth = `${targetMonth}-01`
 const [year, month] = targetMonth.split('-').map(Number)
 const nextMonthFirstDay = new Date(year, month, 1).toISOString().split('T')[0]

 // 指定月の希望休取得
 const { data: offRequests, error: offError } = await supabase
   .from('off_requests')
   .select('staff_id, request_date')
   .gte('request_date', startOfMonth)
   .lt('request_date', nextMonthFirstDay) // 翌月1日より前

  if (offError) {
    console.error('Off Request Fetch Error:', offError)
    throw new Error(`希望休データ取得失敗: ${offError.message}`)
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  
  const prompt = `
  あなたは店舗の高度なシフトスケジューラーです。
  提供されたデータに基づき、${targetMonth} の最適なシフト案を作成してください。

  【重要ルール】
  1. 匿名性の維持: staff_id (UUID) のみを識別子として使用すること。
  2. 希望休の絶対遵守: off_requests にある日付は、そのスタッフを必ず「休み」にすること。
  3. 人員確保: 毎日必ず 2名以上 を出勤させること。
  4. 役割バランス: 可能な限り、1日は "leader" ロールを持つスタッフを1名以上含めること。
  5. 出力制限: 出力は純粋なJSON配列のみとし、解説テキストは一切含めないこと。

  【データ】
  スタッフ属性: ${JSON.stringify(staffContext)}
  希望休リスト: ${JSON.stringify(offRequests)}

  【出力形式】
  [
    {
      "staff_id": "UUID",
      "date": "YYYY-MM-DD",
      "shift_type": "full-time",
      "role": "leader or staff"
    }
  ]
`

  const result = await model.generateContent(prompt)
  return result.response.text()
}