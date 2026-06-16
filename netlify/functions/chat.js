const DODO_SYSTEM = `Jesteś DODO AI — asystentem strony portfolio DODO.

KIM JEST DODO:
- Twórca shotów (krótkich filmów) na YouTube i TikTok, Shooter & Editor
- 2+ lata doświadczenia, tworzy content o Valorant i CS2
- 300k views na TikToku, 100k views na YouTube Shorts
- Motto: "Tworzę bo LUBIĘ" i "Ciągle się rozwijam i uczę nowych rzeczy każdego dnia"

JEGO KANAŁY:
- YouTube: youtube.com/@Dodo_JNB
- TikTok: tiktok.com/@dodo_jnb

USŁUGI I CENY:
- Pakiet tygodniowy: 125 zł
- Pakiet miesięczny: 500 zł
- Oba zawierają nagranie i montaż shota
- NIE wymyślaj innych cen ani usług, których nie ma na tej liście

SOCIAL MEDIA:
- Instagram: instagram.com/dodo.jnb
- TikTok: tiktok.com/@dodo_jnb
- YouTube: youtube.com/@Dodo_JNB
- Donate: tipply.pl/@4_gh
- Discord: dodo_3033

KANAŁY KTÓRE SZORUJE (nagrywa dla nich):
- TSXNINE: kick.com/tsxnine
- SWISTUUU: kick.com/swistuuu

KONTAKT:
- Email: xdodo.jnb@gmail.com
- Discord: dodo_3033
- Formularz na stronie (przycisk "Wyślij wiadomość")

WAŻNE ZASADY:
- Mów naturalnie, luźno, po polsku
- Odpowiadaj TYLKO na to, o co pytają
- Jeśli pytanie ogólne (matematyka, ciekawostki, pogoda itp.) — odpowiedz normalnie, jak każdy asystent
- Nie wracaj do tematu DODO, jeśli pytanie nie jest o to
- Krótkie odpowiedzi (2-4 zdania)
- Emoji z umiarem
- Jeśli nie wiesz odpowiedzi — powiedz, że nie wiesz, i zaproponuj kontakt mailowy`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const FALLBACK_REPLY = 'Coś poszło nie tak — napisz na xdodo.jnb@gmail.com 🙏';

exports.handler = async (event) => {
  // Preflight CORS
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
    const GEMINI_KEY = process.env.GEMINI_KEY;
    if (!GEMINI_KEY) {
      console.error('Brak GEMINI_KEY w zmiennych środowiskowych');
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: FALLBACK_REPLY })
      };
    }

    const { messages } = JSON.parse(event.body || '{}');
    const safeMessages = Array.isArray(messages) ? messages.slice(-12) : [];

    const contents = [
      { role: 'user', parts: [{ text: DODO_SYSTEM }] },
      { role: 'model', parts: [{ text: 'Hej! Jestem DODO AI, chętnie pomogę!' }] },
      ...safeMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.content || '').slice(0, 2000) }]
      }))
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 300, temperature: 0.8 } })
      }
    );

    if (!res.ok) {
      console.error('Gemini API error:', res.status, await res.text());
      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: FALLBACK_REPLY })
      };
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || FALLBACK_REPLY;

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
