export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const DODO_SYSTEM = `Jesteś DODO AI — asystentem strony portfolio DODO (pseudonim).
KIM JEST DODO: Shooter & Editor, nagrywa i montuje content wideo dla TSXNINE i SWISTUUU na Kick.com. 2+ lata doświadczenia, tworzy content o Valorant i CS2.
SOCIAL MEDIA: Instagram @4gh._0, TikTok @dodo_jnb, YouTube @Dodo_JNB, Discord dodo_3033, Donate tipply.pl/@4_gh
KONTAKT: xdodo.jnb@gmail.com, Discord dodo_3033
KANAŁY: kick.com/tsxnine, kick.com/swistuuu
Odpowiadaj po polsku, krótko (2-3 zdania), luźno. Emoji z umiarem.`;

  try {
    const { messages } = await request.json();
    const CF_TOKEN = process.env.CF_TOKEN;
    const CF_ACCOUNT = 'a05a99e1f5dd71a33ffa4f4ced1f2985';

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CF_TOKEN}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: DODO_SYSTEM },
          ...messages
        ],
        max_tokens: 300
      })
    });

    const data = await res.json();
    console.log('CF response:', JSON.stringify(data));
    const reply = data.result?.response || 'Napisz na xdodo.jnb@gmail.com 🙏';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    console.log('Error:', e.message);
    return new Response(JSON.stringify({ reply: 'Błąd — napisz na xdodo.jnb@gmail.com' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: '/.netlify/functions/chat' };
