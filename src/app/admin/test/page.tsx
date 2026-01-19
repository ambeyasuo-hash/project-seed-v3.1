import { createManualClient, createMainClient } from '@/lib/supabase/server';
import { gatewayProxy } from '@/lib/proxy';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TestPage() {
  // 1. Manual DB 接続テスト
  const manualSupabase = createManualClient(true);
  const { data: manualData, error: manualError } = await manualSupabase.from('staff').select('*').limit(1);

  // 2. Main DB 接続テスト (環境変数の存在確認)
  const isMainConfigured = !!process.env.DB_TARGET_URL && !!process.env.DB_TARGET_KEY;

  // 3. Proxy Gateway テスト
  let proxyStatus = "";
  try {
    proxyStatus = await gatewayProxy('ENABLE_AI_CO_PILOT', async () => {
      return "正常通過";
    });
  } catch (e: any) {
    proxyStatus = `エラー: ${e.message}`;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">システム統合テスト</h1>
      
      <div className="grid gap-4 max-w-2xl">
        {/* Manual DB */}
        <div className={`p-4 rounded-lg border ${manualError ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <h2 className="font-bold text-gray-700">1. Manual DB (SHIFT)</h2>
          <p className="text-sm text-gray-600">
            {manualError ? `接続失敗: ${manualError.message}` : `接続成功 (${manualData?.length}件取得)`}
          </p>
        </div>

        {/* Main DB */}
        <div className={`p-4 rounded-lg border ${!isMainConfigured ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <h2 className="font-bold text-gray-700">2. Main DB (SEED)</h2>
          <p className="text-sm text-gray-600">
            {isMainConfigured ? "環境変数設定済み" : "DB_TARGET_URL または KEY が未設定です"}
          </p>
        </div>

        {/* Proxy Gateway */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="font-bold text-gray-700">3. Proxy Gateway</h2>
          <p className="text-sm text-blue-600 font-medium">結果: {proxyStatus}</p>
        </div>

        <Link href="/" className="text-sm text-gray-500 hover:underline mt-4">
          ← トップページへ戻る
        </Link>
      </div>
    </div>
  );
}