import { createMainClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { login } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>;
}) {
  const supabase = createMainClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  const { message } = await searchParams;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">SEED v2 ログイン</h1>
        <form action={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input name="email" type="email" required className="w-full px-3 py-2 border rounded-md" placeholder="admin@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input name="password" type="password" required className="w-full px-3 py-2 border rounded-md" placeholder="••••••••" />
          </div>
          {message && <p className="text-sm text-red-500 text-center">{message}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}