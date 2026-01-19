import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Project SEED v3.1</h1>
        <p className="text-gray-500 mb-8">System Skeleton Established.</p>
        
        <Link 
          href="/admin/test" 
          className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition shadow-lg"
        >
          管理者用：DB接続テストへ
        </Link>
      </div>
    </main>
  );
}