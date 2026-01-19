import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Project SEED v3.1</h1>
        <p className="text-gray-600 mb-8">システム骨格の確立に成功しました。</p>
        
        <div className="space-y-4">
          <Link 
            href="/admin/test" 
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            DB接続ステータスを確認
          </Link>
        </div>
      </div>
    </main>
  );
}