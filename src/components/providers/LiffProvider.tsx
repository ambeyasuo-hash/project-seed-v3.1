// src/components/providers/LiffProvider.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import liff from '@line/liff';

// LIFF SDKの状態とデータを提供するコンテキスト
interface LiffContextType {
  liff: typeof liff | null;
  isLiffInitialized: boolean;
  isLoggedIn: boolean;
  lineProfile: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
  } | null;
  error: string | null;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

/**
 * LIFF初期化と認証状態を管理するプロバイダーコンポーネント
 * 過去の失敗を防ぐため、PC環境での liff.init() の失敗を捕捉し、
 * children のレンダリングをブロックしない安全な設計とする。
 */
export const LiffProvider = ({ children }: { children: ReactNode }) => {
  const [liffInstance, setLiffInstance] = useState<typeof liff | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggedInState, setIsLoggedInState] = useState(false);
  const [profile, setProfile] = useState<LiffContextType['lineProfile']>(null);
  const [error, setError] = useState<string | null>(null);

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

  useEffect(() => {
    if (!liffId) {
      // 開発環境でIDがない場合のエラーメッセージ
      console.error('NEXT_PUBLIC_LIFF_ID is not set.');
      setError('LIFF IDが設定されていません。');
      setIsInitialized(true); // エラーでも初期化フラグは立てて children をレンダリングする
      return;
    }

    // liff.init() の実行と認証チェック
    liff
      .init({ liffId: liffId })
      .then(async () => {
        setLiffInstance(liff);
        const loggedIn = liff.isLoggedIn();
        setIsLoggedInState(loggedIn);
        setIsInitialized(true);

        if (loggedIn && liff.getOS() !== 'web') {
          // LIFFブラウザ内、またはLINEアプリからアクセスの場合
          try {
            const liffProfile = await liff.getProfile();
            setProfile({
              userId: liffProfile.userId,
              displayName: liffProfile.displayName,
              pictureUrl: liffProfile.pictureUrl,
            });
          } catch (profileError) {
            console.error('Failed to get LIFF profile:', profileError);
          }
        } else if (!loggedIn && liff.isInClient()) {
            // LINEアプリ内だが未認証の場合、ログインを促す（PCブラウザは除く）
            liff.login();
        }

        // 注意: PCブラウザでのアクセスの場合、liff.isLoggedIn()はfalseだが、
        // liff.getOS()が'web'のため、自動ログインは実行せず、エラーも出さない。
        // これにより、過去の失敗（PCブラウザでのログイン無限ループ）を防ぐ。

      })
      .catch((initError: any) => {
        // LIFF初期化に失敗した場合の処理 (PCブラウザ等)
        console.warn('LIFF initialization failed. (This is normal on PC browser):', initError.message);
        // エラーが発生しても、children のレンダリングをブロックしないように初期化フラグを立てる
        setIsInitialized(true); 
        // 開発・デバッグ用に liffInstance は null のままにする
      });
  }, [liffId]);

  const contextValue = useMemo(() => ({
    liff: liffInstance,
    isLiffInitialized: isInitialized,
    isLoggedIn: isLoggedInState,
    lineProfile: profile,
    error: error,
  }), [liffInstance, isInitialized, isLoggedInState, profile, error]);

  return (
    <LiffContext.Provider value={contextValue}>
      {children}
    </LiffContext.Provider>
  );
};

/**
 * LiffContextを使用するためのカスタムフック
 * @returns LiffContextType
 */
export const useLiff = () => {
  const context = useContext(LiffContext);
  if (context === undefined) {
    throw new Error('useLiff must be used within a LiffProvider');
  }
  return context;
};

// Next.jsの環境では、LIFF SDKの型がないという警告を回避するために liff のインポートが必要
export default liff;