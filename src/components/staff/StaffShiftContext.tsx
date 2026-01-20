'use client'

import React, { createContext, useContext, PropsWithChildren, useMemo } from 'react'
import { StaffContextType } from '@/app/staff/actions'

// Contextの型定義
interface StaffShiftContextType {
  staffContext: StaffContextType | null
  isLoading: boolean
}

const StaffShiftContext = createContext<StaffShiftContextType | undefined>(undefined)

interface StaffShiftProviderProps extends PropsWithChildren {
  staffContextPromise: Promise<StaffContextType | null>
}

export const StaffShiftContext: React.FC<StaffShiftProviderProps> = ({ staffContextPromise, children }) => {
  // Promiseを読み込むためのReactのuseフック（ここではuse()を模倣）
  // 実際にはSuspenseと組み合わせるが、ここでは簡略化のため直接Promiseを扱う
  const staffContext = use(staffContextPromise)

  const contextValue: StaffShiftContextType = useMemo(() => ({
    staffContext,
    isLoading: staffContext === undefined, // use()が解決するまではundefined
  }), [staffContext])

  return (
    <StaffShiftContext.Provider value={contextValue}>
      {children}
    </StaffShiftContext.Provider>
  )
}

// Contextを使用するためのカスタムフック
export const useStaffShift = (): StaffShiftContextType => {
  const context = useContext(StaffShiftContext)
  if (context === undefined) {
    throw new Error('useStaffShift must be used within a StaffShiftContext')
  }
  return context
}

// use()の型を解決するための一時的なダミー関数（Next.jsの動作環境では不要だが、VSCodeのTSエラー回避のため）
// @ts-ignore
const use = (promise: Promise<any>) => {
  if (promise.status === 'fulfilled') {
    return promise.value
  } else if (promise.status === 'rejected') {
    throw promise.reason
  } else if (promise.status === 'pending') {
    throw promise
  } else {
    promise.status = 'pending'
    promise.then(
      (result: any) => {
        promise.status = 'fulfilled'
        promise.value = result
      },
      (reason: any) => {
        promise.status = 'rejected'
        promise.reason = reason
      }
    )
    throw promise
  }
}