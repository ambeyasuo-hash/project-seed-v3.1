'use client'

import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react'
import liff from '@line/liff'
import { Liff } from '@line/liff/liff'

// LIFF Contextの型定義
interface LiffContextType {
  liff: Liff | null
  isLiffInitialized: boolean
  isLoggedIn: boolean
  lineProfile: liff.Profile | null
  error: Error | null
}

const LiffContext = createContext<LiffContextType | undefined>(undefined)

interface LiffProviderProps extends PropsWithChildren {
  liffId: string
}

export const LiffProvider: React.FC<LiffProviderProps> = ({ liffId, children }) => {
  const [liffInstance, setLiffInstance] = useState<Liff | null>(null)
  const [isLiffInitialized, setIsLiffInitialized] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [lineProfile, setLineProfile] = useState<liff.Profile | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!liffId) {
      setError(new Error('LIFF IDが設定されていません。'))
      return
    }

    liff.init({ liffId })
      .then(() => {
        setLiffInstance(liff)
        setIsLiffInitialized(true)
        setIsLoggedIn(liff.isLoggedIn())

        if (liff.isLoggedIn()) {
          liff.getProfile()
            .then(profile => {
              setLineProfile(profile)
            })
            .catch(e => {
              console.error(e)
              setError(new Error('LINEプロファイルの取得に失敗しました。'))
            })
        }
      })
      .catch((e: Error) => {
        console.error(e)
        setError(new Error('LIFFの初期化に失敗しました。'))
      })
  }, [liffId])

  const contextValue: LiffContextType = {
    liff: liffInstance,
    isLiffInitialized,
    isLoggedIn,
    lineProfile,
    error,
  }

  return <LiffContext.Provider value={contextValue}>{children}</LiffContext.Provider>
}

// Contextを使用するためのカスタムフック
export const useLiff = (): LiffContextType => {
  const context = useContext(LiffContext)
  if (context === undefined) {
    throw new Error('useLiff must be used within a LiffProvider')
  }
  return context
}