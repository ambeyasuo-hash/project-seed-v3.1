import { createClient } from '@supabase/supabase-js'
import { Database } from '../../database.types'

// Manual DB (SHIFT) 用のクライアントを生成
export const createManualClient = () => {
  if (!process.env.NEXT_PUBLIC_MANUAL_SUPABASE_URL || !process.env.NEXT_PUBLIC_MANUAL_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables for Manual DB')
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_MANUAL_SUPABASE_URL,
    process.env.NEXT_PUBLIC_MANUAL_SUPABASE_ANON_KEY
  )
}