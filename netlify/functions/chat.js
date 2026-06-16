const DODO_SYSTEM = `Jesteś DODO AI — asystentem strony portfolio DODO.

KIM JEST DODO:
- Twórca shotów (krótkich filmów) na YouTube i TikTok, Shooter & Editor
- 2+ lata doświadczenia, tworzy content o Valorant i CS2
- 300k views na TikToku, 100k views na YouTube Shorts

JEGO KANAŁY:
- YouTube: youtube.com/@Dodo_JNB
- TikTok: tiktok.com/@dodo_jnb

USŁUGI I CENY:
- Pakiet tygodniowy: 125 zł
- Pakiet miesięczny: 500 zł
- Oba zawierają nagranie i montaż shota

SOCIAL MEDIA:
- Instagram: instagram.com/dodo.jnb
- TikTok: tiktok.com/@dodo_jnb
- YouTube: youtube.com/@Dodo_JNB
- Donate: tipply.pl/@4_gh
- Discord: dodo_3033

KANAŁY KTÓRE SZORUJE:
- TSXNINE: kick.com/tsxnine
- SWISTUUU: kick.com/swistuuu

KONTAKT:
- Email: xdodo.jnb@gmail.com
- Discord: dodo_3033

WAŻNE ZASADY:
- Mów naturalnie, luźno, po polsku
- Odpowiadaj TYLKO na to, o co pytają
- Jeśli pytanie ogólne - odpowiedz normalnie
- Nie wracaj do tematu DODO jeśli nie pytają
- Krótkie odpowiedzi (2-4 zdania)
- Emoji z umiarem`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const FALLBACK_REPLY = 'Coś poszło nie tak — napisz na xdodo.jnb@gmail.com 🙏';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: FALLBACK_REPLY })
    };
  }

  try {
    const CF_TOKEN = process.env.CF_TOKEN;
    const CF_ACCOUNT = 'a05a99e1f5dd71a33ffa4f4ced1f2985';

    if (!CF_TOKEN) {
      console.error('Brak CF_TOKEN');
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: FALLBACK_REPLY })
      };
    }

    const { messages } = JSON.parse(event.body || '{}');
    const safeMessages = Array.isArray(messages) ? messages.slice(-12) : [];

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CF_TOKEN}`
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: DODO_SYSTEM },
            ...safeMessages.map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: String(m.content || '').slice(0, 2000)
            }))
          ],
          max_tokens: 400,
          temperature: 0.8
        })
      }
    );

    if (!res.ok) {
      console.error('CF AI error:', res.status);
      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: FALLBACK_REPLY })
      };
    }

    const data = await res.json();
    const reply = data.result?.response || FALLBACK_REPLY;

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    console.error('Błąd chat:', e);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: FALLBACK_REPLY })
    };
  }
};
