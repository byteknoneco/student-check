import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Content-Type': 'application/json' };

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record ?? payload;
    if (!record?.user_id || !record?.title) {
      return new Response(JSON.stringify({ ok: false, reason: 'missing notification record' }), { status: 400, headers: corsHeaders });
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const client = createClient(url, serviceKey);
    const { data: tokens, error } = await client.from('push_tokens').select('token').eq('user_id', record.user_id).eq('active', true);
    if (error) throw error;
    if (!tokens?.length) return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: corsHeaders });

    const messages = tokens.map((row) => ({
      to: row.token,
      sound: 'default',
      title: record.title,
      body: record.body,
      data: record.data ?? {},
      channelId: 'default',
    }));

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate' },
      body: JSON.stringify(messages),
    });
    const result = await expoResponse.json();
    return new Response(JSON.stringify({ ok: expoResponse.ok, sent: messages.length, result }), { status: expoResponse.ok ? 200 : 502, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500, headers: corsHeaders });
  }
});
