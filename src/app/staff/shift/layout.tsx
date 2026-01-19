// src/app/staff/layout.tsx
import React, { type ReactNode } from 'react';

/**
 * スタッフ向けパス (/staff/*) のレイアウト
 * 将来的に、共通のUIや認証チェックなどをここに追加する
 */
export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 将来的に共通ヘッダーなどをここに追加 */}
      {children}
      {/* 将来的に共通フッターなどをここに追加 */}
    </div>
  );
}