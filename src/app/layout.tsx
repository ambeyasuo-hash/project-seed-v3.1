// src/app/layout.tsx
import './globals.css';
// ★追加: LiffProviderをインポート
import { LiffProvider } from '@/components/providers/LiffProvider';

export const metadata = {
  title: 'Project SEED v3.1',
  description: 'Project SEED - Hyper Agent System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {/* ★修正: LiffProviderでchildrenを囲む */}
        <LiffProvider>
          {children}
        </LiffProvider>
      </body>
    </html>
  );
}