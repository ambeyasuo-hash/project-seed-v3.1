'use client'

import { LiffProvider } from '@/components/liff/LiffProvider'
import { PropsWithChildren } from 'react'

/**
 * LIFFの初期化とContextを提供するラッパーコンポーネント
 * サーバーコンポーネントでラップして使用する
 */
export default function LiffPage({ children }: PropsWithChildren) {
  return (
    <LiffProvider liffId={process.env.NEXT_PUBLIC_LIFF_ID || ''}>
      {children}
    </LiffProvider>
  )
}