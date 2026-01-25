import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseMain } from '@/utils/supabase'; // Main DB接続
import { encrypt } from '@/utils/crypto'; // AES-256-GCM
import { analyzeStaffSentiment } from '@/features/chat/gemini'; // Gemini 2.0 Flash-lite

export const dynamic = 'force-dynamic';

// LINE Messaging API Helper
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

// 過去ログカルーセル生成（Postbackで遡り削除を可能にするUI）
const generateHistoryCarousel = (logs: {id: string, summary: string, created_at: string}[]) => ({
  type: "flex",
  altText: "過去の記憶を整理",
  contents: {
    type: "carousel",
    contents: (logs || []).map(log => ({
      type: "bubble", size: "micro",
      body: {
        type: "box", layout: "vertical", contents: [
          { type: "text", text: log.summary || "（内容なし）", size: "xs", wrap: true },
          { type: "text", text: new Date(log.created_at).toLocaleDateString(), size: "xxs", color: "#aaaaaa" }
        ]
      },
      footer: {
        type: "box", layout: "vertical", contents: [
          { type: "button", style: "link", height: "sm", color: "#FF3B30", 
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

      // 1. テナント情報取得（存在しない場合は作成）
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

      if (!tenant) {
        console.error('Failed to resolve tenant ID.');
        continue;
      }

      // --- Postback Handler (シュレッダー処理) ---
      if (event.type === 'postback') {
        const params = new URLSearchParams(event.postback.data);
        const action = params.get('action');

        // 1. 個別物理削除
        if (action === 'shred') {
          const logId = params.get('log_id');
          if (logId) await supabaseMain.from('logs').delete().eq('id', logId);
        }

        // 2. シュレッダーモード切り替え (トグル)
        if (action === 'toggle_shredder') {
          const nextMode = !tenant.shredder_mode;

          await supabaseMain
            .from('tenants')
            .update({ shredder_mode: nextMode })
            .eq('line_user_id', lineUserId);
          
          if (nextMode) {
            const { data: logs } = await supabaseMain
              .from('logs')
              .select('id, summary, created_at')
              .eq('tenant_id', tenant.id)
              .order('created_at', { ascending: false })
              .limit(10);
            
            await sendReply(event.replyToken, [
              { type: 'text', text: "【シュレッダー：ON】\nこれからの返信に消去ボタンがつきます。過去の記録も以下から消去可能です。" },
              generateHistoryCarousel(logs || [])
            ]);
          } else {
            await sendReply(event.replyToken, [
              { type: 'text', text: "【シュレッダー：OFF】\nこれ以降、AIの返信にボタンはつきません。スレッドをクリーンに保ちます。" }
            ]);
          }
        }
        continue;
      }

      // --- Message Handler (AI対話処理) ---
      if (event.type === 'message' && event.message.type === 'text') {
        const userText = event.message.text.trim();

        // リッチメニューからのテキストコマンド検知
        if (userText === 'シュレッダー切替') {
          const nextMode = !tenant.shredder_mode;

          await supabaseMain
            .from('tenants')
            .update({ shredder_mode: nextMode })
            .eq('line_user_id', lineUserId);

          if (nextMode) {
            const { data: logs } = await supabaseMain
              .from('logs')
              .select('id, summary, created_at')
              .eq('tenant_id', tenant.id)
              .order('created_at', { ascending: false })
              .limit(10);
            
            await sendReply(event.replyToken, [
              { type: 'text', text: "【シュレッダー：ON】\nこれからの返信に消去ボタンがつきます。過去の記録も以下から消去可能です。" },
              generateHistoryCarousel(logs || [])
            ]);
          } else {
            await sendReply(event.replyToken, [
              { type: 'text', text: "【シュレッダー：OFF】\nこれ以降、AIの返信にボタンはつきません。スレッドをクリーンに保ちます。" }
            ]);
          }
          continue; // コマンド処理終了
        }

        // 通常のAI分析処理
        const aiResult = await analyzeStaffSentiment(userText);

        // 保存（IDを取得してシュレッダーボタンに紐付け）
        const { data: logRecord } = await supabaseMain
          .from('logs')
          .insert({
            tenant_id: tenant.id,
            content_encrypted: encrypt(userText),
            category: aiResult.category,
            impact: aiResult.impact,
            summary: aiResult.summary,
            prescription: aiResult.prescription,
            sender: 'USER'
          }).select('id').single();

        // 返信の分岐
        if (tenant.shredder_mode) {
          // ONならコンパクトなFlex (シュレッダーボタン付き)
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
                    action: { type: 'postback', label: '消去', data: `action=shred&log_id=${logRecord?.id}`, displayText: '記憶を消去しました' }
                  }
                ]
              }
            }
          }]);
        } else {
          // OFFならシンプルなテキスト
          await sendReply(event.replyToken, [{ type: 'text', text: aiResult.reply }]);
        }
      }
    }
  } catch (err: any) {
    console.error('Webhook Global Error (Parsing/Fatal):', err.message);
  }

  return NextResponse.json({ message: 'ok' });
}