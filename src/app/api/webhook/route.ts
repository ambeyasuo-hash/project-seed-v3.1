import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseMain } from '@/utils/supabase';
import { encrypt } from '@/utils/crypto';
import { analyzeStaffSentiment } from '@/features/chat/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-line-signature');
  const body = await req.text();

  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
  
  if (hash !== signature) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { events } = JSON.parse(body);

  for (const event of events) {
    if (event.replyToken === "00000000000000000000000000000000") continue;

    if (event.type === 'message' && event.message.type === 'text') {
      try {
        const lineUserId = event.source.userId;
        const userText = event.message.text;

        // A. AI分析
        const aiResult = await analyzeStaffSentiment(userText);

        // B. テナント処理
        // まず既存チェック
        const { data: existingTenant } = await supabaseMain
          .from('tenants')
          .select('id')
          .eq('line_user_id', lineUserId)
          .single();

        let tenant = existingTenant;

        // いなければ作成
        if (!tenant) {
          const { data: newTenant } = await supabaseMain
            .from('tenants')
            .insert({ line_user_id: lineUserId, name: '新規スタッフ' })
            .select()
            .single();
          tenant = newTenant;
        }

        // ★ TS先生を黙らせる決定打 ★
        // ここで「もし tenant が null ならこのループは抜ける」と明示する
        if (!tenant) {
          console.error('Failed to resolve tenant');
          continue;
        }

        // C. 保存 (ここでの tenant.id はもう 100% 安全)
        await supabaseMain.from('logs').insert({
          tenant_id: tenant.id,
          content_encrypted: encrypt(userText),
          category: aiResult.category,
          impact: aiResult.impact,
          summary: aiResult.summary,
          prescription: aiResult.prescription,
          sender: 'USER'
        });

        // D. 返信
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: aiResult.reply }]
          })
        });

      } catch (err: any) {
        console.error('Webhook Error:', err.message);
      }
    }
  }

  return NextResponse.json({ message: 'ok' });
}