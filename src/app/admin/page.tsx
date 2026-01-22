// src/app/admin/page.tsx (新規作成)
import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  // 管理者ルートにアクセスした場合、名簿一覧ページへリダイレクトする
  redirect('/admin/staff');
}