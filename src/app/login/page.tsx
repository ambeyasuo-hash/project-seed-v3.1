// src/app/login/page.tsx (新規作成)
import { createMainClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const supabase = createMainClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // ログイン済みの場合、管理者ページにリダイレクト
    redirect('/admin/staff');
  }

  // 実際にはここに Supabase Auth のログインフォーム UI を配置する
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white shadow-lg rounded-lg text-center">
        <h1 className="text-2xl font-bold mb-4">ログイン</h1>
        <p className="text-gray-600 mb-6">現在、ログインフォームは開発中です。</p>
        <p className="text-sm text-red-500">認証エラーが発生した場合は、一度ログアウトしてください。</p>
        {/* Supabaseのサインインアクションを起動するボタンを配置する必要がある */}
        {/* <form action="/auth/v1/sign-in" method="POST">
             <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
               メールでログイン (ダミー)
             </button>
           </form> */}
      </div>
    </div>
  );
}