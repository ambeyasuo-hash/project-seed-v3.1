import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createManualClient } from '@/lib/manual-db'
import { getStaffByLineId } from '@/app/staff/actions'
import LiffPage from '@/components/staff/LiffPage'
import ShiftRequestForm from '@/components/staff/ShiftRequestForm'
import { StaffShiftContext } from '@/components/staff/StaffShiftContext'
import { useLiff } from '@/components/liff/LiffProvider'

// サーバーコンポーネント
export default async function StaffShiftPage() {
  const cookieStore = cookies()
  const manualClient = createManualClient()

  // LIFF Contextから情報を取得するクライアントコンポーネントをラップ
  return (
    <LiffPage>
      <StaffShiftPageContent manualClient={manualClient} />
    </LiffPage>
  )
}

// クライアントコンポーネント (LIFF Contextを使用)
function StaffShiftPageContent({ manualClient }: { manualClient: ReturnType<typeof createManualClient> }) {
  const { liff, isLiffInitialized, isLoggedIn, lineProfile, error } = useLiff()

  if (error) {
    return <div className="p-4 text-red-500">LIFFエラーが発生しました: {error.message}</div>
  }

  if (!isLiffInitialized) {
    return <div className="p-4">LIFFを初期化中...</div>
  }

  if (!isLoggedIn) {
    // ログインしていない場合はLIFFログイン画面へリダイレクト
    liff.login()
    return <div className="p-4">LINEログインへリダイレクト中...</div>
  }

  // サーバーアクションをクライアント側で呼び出すためのラッパー
  const fetchStaffContext = async (lineId: string) => {
    'use server'
    const result = await getStaffByLineId(lineId)
    if ('success' in result) {
      return result.data
    }
    // エラー時はnullを返す
    return null
  }

  // LINE IDからスタッフ情報を取得
  const staffContextPromise = fetchStaffContext(lineProfile?.userId || '')

  return (
    <StaffShiftContext staffContextPromise={staffContextPromise}>
      <ShiftRequestForm manualClient={manualClient} />
    </StaffShiftContext>
  )
}