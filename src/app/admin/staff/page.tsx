import { getAllStaff } from './actions';
import { Staff } from './actions';
import { notFound } from 'next/navigation';

// Date オブジェクトを YYYY-MM-DD HH:MM 形式の文字列にフォーマットするヘルパー関数
// string | null を許容するように修正し、null の場合は代替文字列を返す
const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) {
        return '登録日時不明'; // null の場合は代替文字列
    }
    return new Date(timestamp).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).replace(/\//g, '-').replace(',', '');
};

export default async function AdminStaffPage() {
    const result = await getAllStaff();

    // Type Guards: サーバーアクションの戻り値は必ず if ('success' in result) で判定する原則に準拠
    if ('error' in result) {
        console.error('Failed to load staff list:', result.error);
        notFound(); 
    }

    const staffList: Staff[] = result.staff;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">管理者: スタッフ名簿一覧</h1>
            
            {staffList.length === 0 ? (
                <p>スタッフはまだ登録されていません。</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">表示名</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">役割</th> {/* employment_type に対応 */}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LINE ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録日時</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {staffList.map((staff) => (
                                <tr key={staff.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.id}</td>
                                    {/* スタッフ名は staff.display_name を使用する原則に準拠 */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.display_name}</td>
                                    {/* role -> employment_type に変更。null の場合は '未設定' を表示 */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.employment_type || '未設定'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.line_id || '未連携'}</td>
                                    {/* created_at の null 許容性に対応 */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTimestamp(staff.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}