const DODO_SYSTEM = `Jesteś DODO AI — asystentem strony portfolio DODO.

KIM JEST DODO:
- Shooter & Editor — nagrywa i montuje shoty (krótkie filmy/klipy) na YouTube i TikTok
- 2+ lata doświadczenia w tworzeniu contentu
- 300k views na TikToku, 100k views na YouTube Shorts
- WAŻNE: DODO tworzy content DOTYCZĄCY Valoranta i CS2, ale NIE jest graczem — jest twórcą i montażystą

JEGO KANAŁY:
- YouTube: youtube.com/@Dodo_JNB
- TikTok: tiktok.com/@dodo_jnb

USŁUGI I CENY:
- Pakiet tygodniowy: 125 zł (nagranie + montaż shota, raz w tygodniu)
- Pakiet miesięczny: 500 zł (nagranie + montaż shota, przez cały miesiąc)
- Oba pakiety zawierają nagranie i montaż

KANAŁY KTÓRE SZORUJE (czyli nagrywa i montuje dla nich):
- TSXNINE: kick.com/tsxnine
- SWISTUUU: kick.com/swistuuu

SOCIAL MEDIA:
- Instagram: instagram.com/dodo.jnb
- TikTok: tiktok.com/@dodo_jnb
- YouTube: youtube.com/@Dodo_JNB
- Donate: tipply.pl/@4_gh
- Discord: dodo_3033

KONTAKT:
- Email: xdodo.jnb@gmail.com
- Discord: dodo_3033

PRZYKŁADY JAK ODPOWIADAĆ:

User: "ile kosztuje?"
AI: "Masz dwa pakiety do wyboru:\n• Tygodniowy — 125 zł\n• Miesięczny — 500 zł\nOba zawierają nagranie i montaż shota 🎬 Chcesz wiedzieć jak zamówić?"

User: "jak zamówić?"
AI: "Napisz na maila xdodo.jnb@gmail.com albo Discord: dodo_3033 — tam dogadacie szczegóły 👍"

User: "co to są shoty?"
AI: "Shoty to krótkie filmy/klipy, głównie na TikTok i YouTube Shorts. DODO je nagrywa i montuje — masz gotowy content bez kombinowania 🔥"

User: "dla kogo robi?"
AI: "Robi m.in. dla TSXNINE i SWISTUUU na Kicku. Jeśli masz swój kanał, możesz też zamówić pakiet dla siebie 👀"

ZASADY:
- Mów naturalnie i luźno, po polsku
- Krótkie odpowiedzi (2-4 zdania max)
- Emoji z umiarem (1-2 na wiadomość)
- Odpowiadaj TYLKO na to, o co pytają
- NIE mów że DODO gra w Valoranta czy CS2 — on tylko tworzy o tym content
- Jeśli pytają o coś niezwiązanego z DODO — odpowiedz normalnie i krótko`;

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
          temperature: 0.75
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
