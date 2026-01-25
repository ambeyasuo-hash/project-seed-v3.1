import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseMain } from '@/utils/supabase'; // Main DB (jngg...)
import { encrypt } from '@/utils/crypto';
import { analyzeStaffSentiment } from '@/features/chat/gemini';
// Flex Message テンプレートをインポート
import { compactShredderResponse, historyShredderCarousel } from '@/features/chat/flex_templates';

export const dynamic = 'force-dynamic';

// --- LINE Messaging API Helper ---
// HTTPエラー時にもログを出すように強化
async function sendReply(replyToken: string, messages: any[]) {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({ replyToken, messages })
  });

  if (!response.ok) {
    const errorBody = await response.status === 400 ? await response.json() : { status: response.status, statusText: response.statusText };
    console.error("--- LINE API Error (Reply Failed) ---", JSON.stringify(errorBody));
    // エラー時は何もしない（サイレント失敗）
  }
  return response;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-line-signature');
  const body = await req.text();
  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
  
  // 1. 署名検証
  if (hash !== signature) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { events } = JSON.parse(body);

  for (const event of events) {
    if (event.replyToken === "00000000000000000000000000000000") continue;

    // --- Postback Handler (トグル機能はテキストコマンドへ移行したため、shredのみ残す) ---
    if (event.type === 'postback') {
      try {
        const params = new URLSearchParams(event.postback.data);
        if (params.get('action') === 'shred') {
          const logId = params.get('log_id');
          if (logId) {
            await supabaseMain.from('logs').delete().eq('id', logId);
          }
        }
      } catch (err: any) {
        console.error('Postback Shredding Error:', err.message);
      }
      continue;
    }

    // --- Message Handler (テキストコマンド & AI対話ロジック) ---
    if (event.type === 'message' && event.message.type === 'text') {
      try {
        const lineUserId = event.source.userId;
        const userText = event.message.text.trim();

        // 2. テナント情報取得（存在しなければ新規作成）
        let { data: tenant } = await supabaseMain
          .from('tenants')
          .select('id, shredder_mode')
          .eq('line_user_id', lineUserId)
          .single();

        if (!tenant) {
          const { data: newTenant } = await supabaseMain
            .from('tenants')
            .insert({ line_user_id: lineUserId, name: '新規スタッフ' })
            .select('id, shredder_mode').single();
          tenant = newTenant;
        }

        // 3. 【テキストコマンド検知】シュレッダーモード切り替え
        if (userText === 'シュレッダー切替') {
          const nextMode = !tenant?.shredder_mode;
          
          await supabaseMain
            .from('tenants')
            .update({ shredder_mode: nextMode })
            .eq('id', tenant!.id);

          if (nextMode) {
            const { data: logs } = await supabaseMain
              .from('logs')
              .select('id, summary, created_at')
              .eq('tenant_id', tenant!.id)
              .order('created_at', { ascending: false })
              .limit(10);
            
            const carousel = historyShredderCarousel(logs || []);
            
            return await sendReply(event.replyToken, [
              { type: 'text', text: "【シュレッダー：ON】\nこれからの返信に消去ボタンがつきます。過去の記録を消す場合は以下から選択してください。" },
              carousel
            ]);
          } else {
            return await sendReply(event.replyToken, [
              { type: 'text', text: "【シュレッダー：OFF】\nこれ以降、AIの返信にボタンはつきません。スレッドをクリーンに保ちます。" }
            ]);
          }
        }

        // 4. 通常のAI対話ロジック
        const aiResult = await analyzeStaffSentiment(userText);
        
        // 5. DB保存
        const { data: logRecord } = await supabaseMain
          .from('logs')
          .insert({
            tenant_id: tenant!.id,
            content_encrypted: encrypt(userText),
            category: aiResult.category,
            impact: aiResult.impact,
            summary: aiResult.summary,
            prescription: aiResult.prescription,
            sender: 'USER'
          }).select('id').single();

        // 6. 返信の分岐と堅牢化
        const safeReply = aiResult.reply && aiResult.reply.length > 0 
          ? aiResult.reply 
          : "（システムエラーにより応答できませんでした。お時間を置いてお試しください。）";

        if (tenant?.shredder_mode) {
          // ONなら修正されたFlex Messageを使用
          const flexMessage = compactShredderResponse(safeReply, logRecord?.id);
          await sendReply(event.replyToken, [flexMessage]);
        } else {
          // OFFならシンプルなテキスト
          await sendReply(event.replyToken, [{ type: 'text', text: safeReply }]);
        }

      } catch (err: any) {
        console.error('Webhook Error:', err.message);
        // エラー時にも応答を試みる（LINEの迷惑リトライを防ぐため）
        await sendReply(event.replyToken, [{ type: 'text', text: "処理中にエラーが発生しました。時間を置いてお試しください。" }]);
      }
    }
  }
  return NextResponse.json({ message: 'ok' });
}