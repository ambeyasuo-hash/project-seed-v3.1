'use server'

import { createManualClient } from '@/lib/db/server'
import { Database } from '@/types/database'

type StaffResult = { success: true, staff: Database['public']['Tables']['staff_data']['Row'] } | { error: string }

/**
 * LINE ID を基にスタッフ情報を取得 (Staff Feature に集約)
 */
export async function getStaffByLineId(liffUserId: string): Promise<StaffResult> {
  if (!liffUserId) return { error: 'LINE User ID is required.' }

  const supabase = createManualClient() 
  const { data, error } = await supabase
    .from('staff_data')
    .select('*')
    .eq('line_id', liffUserId)
    .single()

  if (error) {
    console.error('Error fetching staff:', error)
    return { error: 'スタッフ情報の取得に失敗しました。' }
  }

  return { success: true, staff: data }
}