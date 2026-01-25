import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseMain } from '@/utils/supabase';
import { encrypt } from '@/utils/crypto';
import { analyzeStaffSentiment } from '@/features/chat/gemini';

export const dynamic = 'force-dynamic';

// --- LINE Messaging API Helper (エラーログ機能強化) ---
async function sendReply(replyToken: string, messages: any[]) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({ replyToken, messages })
  });

  if (!response.ok) {
    const errorBody = await response.json();
    console.error("--- LINE API Error (Reply Failed) ---", JSON.stringify(errorBody));
  }
  return response;
}

// --- 過去ログカルーセル生成（デバッグのため非使用） ---
function generateHistoryCarousel(logs: {id: string, summary: string, created_at: string}[]) {
  return {
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
  };
}

export async function POST(req: NextRequest) {
  // 署名検証とボディの読み込みはtry-catchで囲まないことで初期エラーのログを確実にする
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

      // 1. Postback Handler (シュレッダー処理)
      if (event.type === 'postback') {
        const params = new URLSearchParams(event.postback.data);
        const action = params.get('action');

        if (action === 'shred') {
          const logId = params.get('log_id');
          if (logId) {
            await supabaseMain.from('logs').delete().eq('id', logId);
            console.log(`[SHREDDER] Deleted log ID: ${logId}`);
          }
        }
        continue;
      }

      // 2. Message Handler
      if (event.type === 'message' && event.message.type === 'text') {
        const userText = event.message.text.trim();

        // A. テナント情報取得（トグルに必要なshredder_modeも含める）
        let { data: tenant } = await supabaseMain
          .from('tenants')
          .select('id, shredder_mode')
          .eq('line_user_id', lineUserId)
          .single();

        // 新規テナント登録
        if (!tenant) {
          const { data: newTenant } = await supabaseMain
            .from('tenants')
            .insert({ line_user_id: lineUserId, name: '新規スタッフ' })
            .select('id, shredder_mode').single();
          tenant = newTenant;
        }

        // B. リッチメニューからのテキストコマンド検知（シュレッダー切替）
        if (userText === 'シュレッダー切替') {
          const nextMode = !tenant?.shredder_mode;
          await supabaseMain
            .from('tenants')
            .update({ shredder_mode: nextMode })
            .eq('line_user_id', lineUserId);
          
          if (nextMode) {
            // ON時: 過去ログ表示（※Flexエラー回避のため、今回はテキストのみ）
            await sendReply(event.replyToken, [
              { type: 'text', text: "【シュレッダー：ON】\nこの状態では、ログは保存されますが、次回以降の返信に消去ボタンを付けるための準備ができました。過去ログはダッシュボードからご確認ください。" }
            ]);
          } else {
            // OFF時:
            await sendReply(event.replyToken, [
              { type: 'text', text: "【シュレッダー：OFF】\nこれ以降、AIの返信にボタンはつきません。スレッドをクリーンに保ちます。" }
            ]);
          }
          continue; // コマンド処理終了
        }

        // C. 通常のAI対話
        const aiResult = await analyzeStaffSentiment(userText);
        
        // D. 保存（ユーザー発言のみ。AI返信は返信後にログ出力）
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

        // E. 返信
        const safeReply = aiResult.reply && aiResult.reply.length > 0 
          ? aiResult.reply 
          : "（AIからの返信内容が空でした。プロンプトを見直してください）";
        
        // Flexエラーを避けるため、シンプルなテキストメッセージで返信
        await sendReply(event.replyToken, [{ type: 'text', text: safeReply }]);
        
        // AIの返信もログに記録 (ダッシュボード用)
        await supabaseMain
            .from('logs')
            .insert({
                tenant_id: tenant!.id,
                content_encrypted: encrypt(safeReply),
                category: aiResult.category,
                impact: aiResult.impact,
                summary: 'AI応答',
                prescription: '',
                sender: 'AI'
            });


      }
    }
  } catch (err: any) {
    console.error('--- FATAL ERROR IN WEBHOOK BODY ---', err.message);
  }

  return NextResponse.json({ message: 'ok' });
}