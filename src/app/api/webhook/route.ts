import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseMain } from '@/utils/supabase';
import { encrypt } from '@/utils/crypto';
import { analyzeStaffSentiment } from '@/features/chat/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. 入口で即座にログを出す
  console.log('--- WEBHOOK ENTRANCE ---');
  
  const signature = req.headers.get('x-line-signature');
  const body = await req.text();
  console.log('Signature:', signature);
  console.log('Body snippet:', body.substring(0, 100));

  if (!signature) {
    console.error('No signature found in headers');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  // 2. 署名検証のログ
  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
  
  if (hash !== signature) {
    console.error('Signature mismatch! Calculated:', hash, 'Expected:', signature);
    // 開発中はあえて401を返さず進むのも手ですが、まずはログで確認
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { events } = JSON.parse(body);
  console.log('Events count:', events.length);

  for (const event of events) {
    console.log('Event Type:', event.type);
    
    if (event.type === 'message' && event.message.type === 'text') {
      try {
        const userText = event.message.text;
        console.log('Processing message:', userText);

        // A. AI
        const aiResult = await analyzeStaffSentiment(userText);
        console.log('AI Result:', aiResult.reply);

        // B. DB & 返信 (ここではあえて最小限に)
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
        console.log('Reply sent successfully');
      } catch (err: any) {
        console.error('Processing Error:', err.message);
      }
    }
  }

  return NextResponse.json({ message: 'ok' });
}