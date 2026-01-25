import { NextRequest, NextResponse } from 'next/server';
import { createMainClient } from '@/lib/supabase/server'; // サーバーサイドクライアント
import { decrypt } from '@/utils/crypto'; // 復号処理
import { verifyAdmin } from '@/lib/auth/admin'; // 管理者認証関数
import { Tables } from '@/types/database_main'; // Main DBの型定義をインポート

// logsテーブルから取得する行の型定義 (selectで取得するカラムのみに限定)
type LogRow = Pick<Tables<'logs'>, 'content_encrypted' | 'category' | 'impact' | 'summary' | 'prescription' | 'created_at'>;

// 現場の叫び（ログ）を集計・分析するAPIエンドポイント
export async function GET(req: NextRequest) {
    
    // 認証チェック
    try {
        const isAdmin = await verifyAdmin();
        if (!isAdmin) {
            // 「鏡と処方箋」の哲学に基づき、経営層以外はアクセス禁止
            return NextResponse.json({ error: 'Unauthorized. Admin access required for Hertz Dashboard.' }, { status: 401 });
        }
    } catch (e) {
        console.error('Admin verification failed:', e);
        return NextResponse.json({ error: 'Authentication service error.' }, { status: 500 });
    }

    try {
        const supabaseMain = createMainClient();

        // logsテーブルから必要なフィールドを取得
        const { data: logs, error } = await supabaseMain
            .from('logs')
            .select('content_encrypted, category, impact, summary, prescription, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch logs from DB.' }, { status: 500 });
        }

        if (!logs || logs.length === 0) {
            return NextResponse.json({ message: 'No logs available.' }, { status: 200 });
        }

        const hertzData = logs.map((log: LogRow) => {
            // 暗号化された生の声を復号
            let decryptedContent = '復号失敗';
            try {
                // content_encrypted は AES-256-GCM で暗号化された現場の「生の叫び」
                decryptedContent = decrypt(log.content_encrypted);
            } catch (e) {
                console.error('Decryption failed for a log entry:', e);
            }

            // 復号された生の叫びと、AIによって構造化されたデータを集計用に整形
            return {
                timestamp: log.created_at,
                raw_scream: decryptedContent, // 現場の叫び (鏡)
                category: log.category,
                impact: log.impact, // 1〜5の数値 (Hertz)
                summary: log.summary,
                prescription: log.prescription, // 経営層への処方箋
            };
        });

        return NextResponse.json({
            status: 'success',
            data: hertzData,
        }, { status: 200 });

    } catch (e) {
        console.error('Hertz Data API internal error:', e);
        return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
    }
}