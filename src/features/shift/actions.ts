'use server'

import { createManualClient } from '@/lib/db/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/**
 * スタッフからの希望休提出
 */
export async function submitShiftRequest(payload: any) {
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

  // 匿名化ビューからのデータ取得 (AIの聖域化)
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
    .lt('request_date', nextMonthFirstDay)

  if (offError) {
    console.error('Off Request Fetch Error:', offError)
    throw new Error(`希望休データ取得失敗: ${offError.message}`)
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" })
  
  const prompt = `
    あなたは店舗の高度なシフトスケジューラーです。
    ${targetMonth}-01 から その月の末日まで、全日程のシフト案を作成してください。
    一部の日程だけでなく、必ず1ヶ月分すべてのデータを網羅すること。

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
  const responseText = result.response.text()
  
  try {
    const cleanedJson = responseText.replace(/```json|```/g, '').trim()
    const draft = JSON.parse(cleanedJson)

    const violations = draft.filter((s: any) => 
      offRequests?.some(off => off.staff_id === s.staff_id && off.request_date === s.date)
    )

    return { success: true, data: draft, violated: violations.length > 0 }
  } catch (e) {
    console.error('JSON Parse Error:', responseText)
    throw new Error('AIの回答形式が不正です。')
  }
}

/**
 * 生成されたシフト案を保存する
 */
export async function saveShiftDraft(shifts: any[]) {
  const supabase = createManualClient()

  const insertData = shifts.map(s => ({
    staff_id: s.staff_id,
    work_date: s.date,
    start_time: s.shift_type === 'full-time' ? '09:00:00' : '13:00:00',
    end_time: s.shift_type === 'full-time' ? '18:00:00' : '18:00:00',
    status: 'draft'
  }))

  const { error } = await supabase
    .from('shifts')
    .insert(insertData)

  if (error) {
    console.error('Save Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * 保存済みシフト一覧を取得する
 */
export async function getShifts(targetMonth: string) {
  const supabase = createManualClient()

  const startOfMonth = `${targetMonth}-01`
  const [year, month] = targetMonth.split('-').map(Number)
  const nextMonthFirstDay = new Date(year, month, 1).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('shifts')
    .select(`
      *,
      staff_data (
        display_name
      )
    `)
    .gte('work_date', startOfMonth)
    .lt('work_date', nextMonthFirstDay)
    .order('work_date', { ascending: true })

  if (error) {
    console.error('Fetch Shifts Error:', error)
    throw new Error('シフトの取得に失敗しました。')
  }

  return data
}

/**
 * 指定月の下書きシフトをすべて削除する
 */
export async function deleteDraftShifts(targetMonth: string) {
  const supabase = createManualClient()

  const startOfMonth = `${targetMonth}-01`
  const [year, month] = targetMonth.split('-').map(Number)
  const nextMonthFirstDay = new Date(year, month, 1).toISOString().split('T')[0]

  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('status', 'draft')
    .gte('work_date', startOfMonth)
    .lt('work_date', nextMonthFirstDay)

  if (error) {
    console.error('Delete Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
