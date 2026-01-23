import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseMain } from '@/utils/supabase';
import { encrypt } from '@/utils/crypto';
import { analyzeStaffSentiment } from '@/features/chat/gemini';

export const dynamic = 'force-dynamic';

// --- LINE Messaging API Helper ---
async function sendReply(replyToken: string, messages: any[]) {
  return await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({ replyToken, messages })
  });
}

// --- 過去ログカルーセル生成関数 ---
function generateHistoryCarousel(logs: any[]) {
  if (!logs || logs.length === 0) {
    return { type: 'text', text: "消去できる過去の記録はありません。" };
  }

  return {
    type: "flex",
    altText: "過去の記憶を整理",
    contents: {
      type: "carousel",
      contents: logs.map(log => ({
        type: "bubble",
        size: "micro",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: log.summary || "（内容なし）", size: "xs", wrap: true, weight: "bold" },
            { type: "text", text: new Date(log.created_at).toLocaleDateString('ja-JP'), size: "xxs", color: "#aaaaaa" }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "link",
              height: "sm",
              color: "#FF3B30",
              action: {
                type: "postback",
                label: "消去",
                data: `action=shred&log_id=${log.id}`,
                displayText: "過去の記憶を消去しました"
              }
            }
          ]
        }
      }))
    }
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-line-signature');
  const body = await req.text();
  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
  
  if (hash !== signature) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { events } = JSON.parse(body);

  for (const event of events) {
    if (event.replyToken === "00000000000000000000000000000000") continue;

    // --- 1. Postback Handler (物理削除) ---
    if (event.type === 'postback') {
      const params = new URLSearchParams(event.postback.data);
      if (params.get('action') === 'shred') {
        const logId = params.get('log_id');
        if (logId) {
          await supabaseMain.from('logs').delete().eq('id', logId);
          console.log(`[SHREDDER] Deleted log: ${logId}`);
        }
      }
      continue;
    }

    // --- 2. Message Handler ---
    if (event.type === 'message' && event.message.type === 'text') {
      try {
        const lineUserId = event.source.userId;
        const userText = event.message.text;

        // A. テナント/ユーザー情報の取得（モード確認）
        let { data: tenant } = await supabaseMain
          .from('tenants')
          .select('*')
          .eq('line_user_id', lineUserId)
          .single();

        if (!tenant) {
          const { data: newTenant } = await supabaseMain
            .from('tenants')
            .insert({ line_user_id: lineUserId, name: '新規スタッフ' })
            .select().single();
          tenant = newTenant;
        }

        // B. 特殊コマンド「シュレッダー切替」の検知
        if (userText === 'シュレッダー切替') {
          const nextMode = !tenant?.shredder_mode;
          await supabaseMain
            .from('tenants')
            .update({ shredder_mode: nextMode })
            .eq('line_user_id', lineUserId);

          if (nextMode) {
            // ON時：過去10件を取得してカルーセル表示
            const { data: pastLogs } = await supabaseMain
              .from('logs')
              .select('id, summary, created_at')
              .eq('tenant_id', tenant?.id)
              .order('created_at', { ascending: false })
              .limit(10);

            return await sendReply(event.replyToken, [
              { type: 'text', text: "【シュレッダーモード：ON】\nこれからの返信に消去ボタンがつきます。過去の記録もここから消去できます。" },
              generateHistoryCarousel(pastLogs || [])
            ]);
          } else {
            // OFF時
            return await sendReply(event.replyToken, [
              { type: 'text', text: "【シュレッダーモード：OFF】\nこれ以降、AIの返信に消去ボタンはつきません。" }
            ]);
          }
        }

        // C. 通常のAI対話ロジック
        const aiResult = await analyzeStaffSentiment(userText);

        // D. ログ保存
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

        // E. モードに応じた返信の出し分け
        if (tenant?.shredder_mode) {
          // モードON: ボタン付きFlex
          await sendReply(event.replyToken, [{
            type: 'flex',
            altText: 'AI返信（消去ボタン付）',
            contents: {
              type: 'bubble', size: 'sm',
              body: {
                type: 'box', layout: 'vertical', contents: [
                  { type: 'text', text: aiResult.reply, wrap: true, size: 'sm', color: '#333333' }
                ]
              },
              footer: {
                type: 'box', layout: 'vertical', contents: [
                  { type: 'button', style: 'link', height: 'sm', color: '#FF3B30',
                    action: { 
                      type: 'postback', 
                      label: 'この記憶を消去', 
                      data: `action=shred&log_id=${logRecord?.id}`,
                      displayText: '今の記憶をシュレッダーにかけました。'
                    }
                  }
                ]
              }
            }
          }]);
        } else {
          // モードOFF: シンプルなテキスト
          await sendReply(event.replyToken, [{ type: 'text', text: aiResult.reply }]);
        }

      } catch (err: any) {
        console.error('Webhook Error:', err.message);
      }
    }
  }
  return NextResponse.json({ message: 'ok' });
}