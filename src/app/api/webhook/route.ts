import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseMain } from '@/utils/supabase';
import { encrypt } from '@/utils/crypto';
import { analyzeStaffSentiment } from '@/features/chat/gemini';

export const dynamic = 'force-dynamic';

// --- LINE Messaging API Helper ---
async function sendReply(replyToken: string, messages: any[]) {
  // ログに残らない問題を避けるため、送信内容をログに出力
  console.log("LINE Reply attempt:", JSON.stringify(messages).substring(0, 200) + '...'); 
  
  return await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({ replyToken, messages })
  });
}

// --- Flex Message Generator (堅牢化済み) ---
const generateCompactShredderFlex = (text: string, logId: string) => {
    // 応答本文が空なら、エラーメッセージを返すことでLINEの送信失敗を防ぐ
    const safeText = text && text.trim() !== '' ? text : '（AIが応答を生成できませんでした。時間を置いてお試しください）';
    
    return {
        type: 'flex',
        altText: 'AI副操縦士からの返信',
        contents: {
            type: 'bubble',
            size: 'sm', // コンパクトサイズ
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    { type: 'text', text: safeText, wrap: true, size: 'sm', color: '#333333' }
                ]
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        style: 'link',
                        height: 'sm',
                        color: '#FF3B30',
                        action: {
                            type: 'postback',
                            label: '消去',
                            data: `action=shred&log_id=${logId}`,
                            displayText: '記憶を消去しました'
                        }
                    }
                ]
            }
        }
    };
};

// --- 過去ログカルーセル生成 ---
const generateHistoryCarousel = (logs: {id: string, summary: string, created_at: string}[]) => ({
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
          { type: "text", text: log.summary || "（内容なし）", size: "xs", wrap: true },
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
            action: { type: "postback", label: "消去", data: `action=shred&log_id=${log.id}`, displayText: "過去の記憶を消去しました" }
          }
        ]
      }
    }))
  }
});


export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-line-signature');
  const body = await req.text();
  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
  
  if (hash !== signature) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { events } = JSON.parse(body);

    for (const event of events) {
      if (event.replyToken === "00000000000000000000000000000000") continue;

      const lineUserId = event.source.userId;
      if (!lineUserId) continue;

      // --- Postback Handler (物理削除) ---
      if (event.type === 'postback') {
        const params = new URLSearchParams(event.postback.data);
        const action = params.get('action');

        if (action === 'shred') {
          const logId = params.get('log_id');
          if (logId) await supabaseMain.from('logs').delete().eq('id', logId);
          console.log(`[SHREDDER] Deleted log ID: ${logId}`);
        }
        continue;
      }

      // --- Message Handler ---
      if (event.type === 'message' && event.message.type === 'text') {
        const userText = event.message.text;

        // 1. テナント情報取得と新規登録
        let { data: tenant } = await supabaseMain
          .from('tenants')
          .select('id, shredder_mode')
          .eq('line_user_id', lineUserId)
          .single();

        if (!tenant) {
          const { data: newTenant } = await supabaseMain
            .from('tenants')
            .insert({ line_user_id: lineUserId, name: '新規スタッフ' })
            .select().single();
          tenant = newTenant;
        }

        // --- 2. リッチメニューのテキストコマンドによるトグル ---
        if (userText === 'シュレッダー切替') {
          const nextMode = !tenant?.shredder_mode;
          await supabaseMain.from('tenants').update({ shredder_mode: nextMode }).eq('line_user_id', lineUserId);
          
          if (nextMode) {
            const { data: logs } = await supabaseMain
              .from('logs')
              .select('id, summary, created_at')
              .eq('tenant_id', tenant!.id)
              .order('created_at', { ascending: false }).limit(10);

            await sendReply(event.replyToken, [
              { type: 'text', text: "【シュレッダー：ON】\nこれからの返信に消去ボタンがつきます。過去の記録も以下から消去可能です。" },
              generateHistoryCarousel(logs || [])
            ]);
          } else {
            await sendReply(event.replyToken, [{ type: 'text', text: "【シュレッダー：OFF】\nこれ以降、AIの返信にボタンはつきません。スレッドをクリーンに保ちます。" }]);
          }
          return NextResponse.json({ message: 'ok' }); // コマンド処理後、通常の流れをスキップ
        }


        // --- 3. 通常のAI対話 & 記録ロジック ---
        const aiResult = await analyzeStaffSentiment(userText);
        
        // ログ保存 (aiResult.replyは保存しない)
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

        if (!logRecord) throw new Error('Failed to insert log and retrieve ID');

        // 4. 返信の分岐 (沈黙対策としてFlex生成ロジックを分離)
        if (tenant?.shredder_mode) {
          // ONなら Flex Message (コンパクト版)
          const flexMessage = generateCompactShredderFlex(aiResult.reply, logRecord.id);
          await sendReply(event.replyToken, [flexMessage]);
        } else {
          // OFFならシンプルな Text Message
          await sendReply(event.replyToken, [{ type: 'text', text: aiResult.reply || '応答なし' }]);
        }
      }
    }
  } catch (err: any) {
    console.error('Final Catch (Critical Error in Event Loop):', err.message);
  }

  return NextResponse.json({ message: 'ok' });
}