import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">店舗管理コックピット</h1>
        <p className="text-gray-500 mt-2">Grand Design v2.4 準拠の管理ステーション</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. 店舗設定（旧 store-policy） */}
        <div className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">🏪</div>
          <h2 className="text-lg font-bold">店舗基本設定</h2>
          <p className="text-sm text-gray-500 mb-4">営業時間・労基法ガードレールの共通設定</p>
          <Link 
            href="/dashboard/settings" 
            className="text-blue-600 font-medium text-sm hover:underline"
          >
            設定を開く →
          </Link>
        </div>

        {/* 2. スタッフ管理（個別ガードレール） */}
        <div className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">👤</div>
          <h2 className="text-lg font-bold">スタッフ管理</h2>
          <p className="text-sm text-gray-500 mb-4">個別就業条件・スタッフ名簿の管理</p>
          <Link 
            href="/dashboard/staff" 
            className="text-blue-600 font-medium text-sm hover:underline"
          >
            名簿一覧を表示 →
          </Link>
        </div>

        {/* 3. AIシフト生成（admin/shift-gen への橋渡し） */}
        <div className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">⚡</div>
          <h2 className="text-lg font-bold">AIシフト作成</h2>
          <p className="text-sm text-gray-500 mb-4">最適化エンジンによるシフト自動生成</p>
          <Link 
            href="/admin/shift-gen" 
            className="text-blue-600 font-medium text-sm hover:underline"
          >
            生成画面へ →
          </Link>
        </div>

        {/* 4. 管理者専用聖域 (Sanctuary) */}
        <div className="border rounded-xl p-6 bg-gray-50 shadow-sm border-dashed">
          <div className="text-2xl mb-2">🛡️</div>
          <h2 className="text-lg font-bold text-gray-700">管理者専用聖域</h2>
          <p className="text-sm text-gray-500 mb-4">高度なシステム設定・ログ確認</p>
          <Link 
            href="/dashboard/sanctuary" 
            className="text-gray-600 font-medium text-sm hover:underline"
          >
            聖域へ入る →
          </Link>
        </div>

      </div>
    </div>
  );
}