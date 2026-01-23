import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseMain } from '@/utils/supabase';
import { encrypt } from '@/utils/crypto';
import { analyzeStaffSentiment } from '@/features/chat/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-line-signature')!;
  const body = await req.text();

  // 1. 署名検証 (Security First)
  const channelSecret = process.env.LINE_CHANNEL_SECRET!;
  const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
  if (hash !== signature) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { events } = JSON.parse(body);

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const lineUserId = event.source.userId;
      const userText = event.message.text;

      // A. AIによる分析と処方箋生成
      const aiResult = await analyzeStaffSentiment(userText);

      // B. テナント確認 & 自動登録
      let { data: tenant } = await supabaseMain
        .from('tenants')
        .select('id')
        .eq('line_user_id', lineUserId)
        .single();

      if (!tenant) {
        const { data: newTenant } = await supabaseMain
          .from('tenants')
          .insert({ line_user_id: lineUserId, name: '新規店舗スタッフ' })
          .select()
          .single();
        tenant = newTenant;
      }

      // C. データの秘匿化と保存
      await supabaseMain.from('logs').insert({
        tenant_id: tenant?.id,
        content_encrypted: encrypt(userText), // 生の発言は暗号化
        category: aiResult.category,
        impact: aiResult.impact,
        summary: aiResult.summary,
        prescription: aiResult.prescription,
        sender: 'USER'
      });

      // D. LINEへの返信 (Flex Message想定だがまずは簡易テキスト)
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
    }
  }

  return NextResponse.json({ message: 'ok' });
}