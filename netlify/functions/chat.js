
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
    const GEMINI_KEY = process.env.GEMINI_KEY;

    const contents = [
      { role: 'user', parts: [{ text: DODO_SYSTEM }] },
      { role: 'model', parts: [{ text: 'Hej! Jestem DODO AI, chętnie pomogę!' }] },
      ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }))
    ];

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 300 } })
    });

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Napisz na xdodo.jnb@gmail.com 🙏';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ reply: 'Błąd — napisz na xdodo.jnb@gmail.com' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: '/.netlify/functions/chat' };
