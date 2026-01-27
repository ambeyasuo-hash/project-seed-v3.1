export const dynamic = 'force-dynamic';
// src/app/admin/staff/page.tsx
import { getAllStaffs } from "../actions";
import { StaffTable } from "./StaffTable"; // <--- 修正: ファイル名を正しくインポート

// 管理者名簿一覧ページ (Server Component)
export default async function AdminStaffPage() {
  const result = await getAllStaffs();
  
  // 認証・エラー処理
  if (!result.success) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">管理者ダッシュボード - スタッフ名簿</h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">アクセスエラー</p>
          <p>{result.message}</p>
          {/* result.message に含まれる UNAUTHENTICATED の可能性を考慮するが、
             result.error は 'AUTH_ERROR' または 'DB_ERROR' のみ。
             ここでは result.message の内容を直接表示することで対応する。
             エラーの種類のチェックは一旦削除する。 */}
          {/* {result.error === 'UNAUTHENTICATED' && <p className="mt-2">ログインページへリダイレクトします。</p>} // 削除 */}
        </div>
      </div>
    );
  }

  
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">スタッフ名簿一覧 (管理者)</h1>
      <p className="text-sm text-gray-500 mb-4">Manual DB に登録されている全スタッフ({result.staffs.length}名)の情報を表示しています。</p>
      
      {/* スタッフ一覧テーブルコンポーネント (後述) */}
      <StaffTable staffs={result.staffs} /> 

    </div>
  );

}