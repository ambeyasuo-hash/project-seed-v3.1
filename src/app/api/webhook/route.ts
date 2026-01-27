import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseMain } from '@/utils/supabase';
import { encrypt } from '@/utils/crypto';
import { analyzeStaffSentiment } from '@/features/chat/gemini';
import { compactShredderResponse, historyShredderCarousel } from '@/features/chat/flex_templates';

export const dynamic = 'force-dynamic';

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
    const errorBody = await response.json();
    console.error("--- LINE API Error ---", JSON.stringify(errorBody));
  }
  return response;
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

    if (event.type === 'postback') {
      try {
        const params = new URLSearchParams(event.postback.data);
        if (params.get('action') === 'shred') {
          const logId = params.get('log_id');
          if (logId) await supabaseMain.from('logs').delete().eq('id', logId);
        }
      } catch (err: any) {
        console.error('Postback Error:', err.message);
      }
      continue;
    }

    if (event.type === 'message' && event.message.type === 'text') {
      try {
        const lineUserId = event.source.userId;
        const userText = event.message.text.trim();

        // 1. テナント情報取得・初期化
        let { data: tenant } = await supabaseMain
          .from('tenants')
          .select('id, shredder_mode')
          .eq('line_user_id', lineUserId)
          .single();

        if (!tenant) {
          const { data: newTenant, error: insertError } = await supabaseMain
            .from('tenants')
            .insert({ line_user_id: lineUserId, name: '新規スタッフ' })
            .select('id, shredder_mode').single();
          
          if (insertError) throw new Error(`Tenant Init Failed: ${insertError.message}`);
          tenant = newTenant;
        }
        if (!tenant) throw new Error('Tenant Context Missing');

        // 2. テキストコマンド
        if (userText === 'シュレッダー切替') {
          const nextMode = !tenant.shredder_mode;
          await supabaseMain.from('tenants').update({ shredder_mode: nextMode }).eq('id', tenant.id);

          if (nextMode) {
            const { data: logs } = await supabaseMain
              .from('logs').select('id, summary, created_at')
              .eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(10);
            return await sendReply(event.replyToken, [
              { type: 'text', text: "【シュレッダー：ON】\nこれからの返信に消去ボタンがつきます。" },
              historyShredderCarousel(logs || [])
            ]);
          } else {
            return await sendReply(event.replyToken, [{ type: 'text', text: "【シュレッダー：OFF】" }]);
          }
        }

        // 3. AI対話 & ログ保存
        const aiResult = await analyzeStaffSentiment(userText);
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

        // 4. 返信実行
        const safeReply = aiResult.reply || "（応答を生成できませんでした。時間を置いて再度お試しください）";

        if (tenant.shredder_mode) {
          await sendReply(event.replyToken, [compactShredderResponse(safeReply, logRecord?.id)]);
        } else {
          await sendReply(event.replyToken, [{ type: 'text', text: safeReply }]);
        }

      } catch (err: any) {
        console.error('Webhook Error:', err.message);
        await sendReply(event.replyToken, [{ type: 'text', text: "現在、一時的に応答が不安定になっています。" }]);
      }
    }
  }
  return NextResponse.json({ message: 'ok' });
}