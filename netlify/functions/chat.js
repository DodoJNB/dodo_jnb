export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const DODO_SYSTEM = `Jesteś DODO AI — asystentem strony portfolio DODO.

KIM JEST DODO:
- Twórca shotów (krótkich filmów) na YouTube i TikTok
- 2+ lata doświadczenia, tworzy content o CS2
- Ma 300k views na TikToku i 100k views na YouTube Shorts

JEGO KANAŁY:
- YouTube: youtube.com/@Dodo_JNB
- TikTok: tiktok.com/@dodo_jnb

USŁUGI:
- Pakiet tygodniowy: 125 zł
- Pakiet miesięczny: 500 zł
- Oba zawierają nagranie i montaż shota

SOCIAL MEDIA:
- Instagram: instagram.com/4gh._0
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
- NAJWAŻNIEJSZE: odpowiadaj TYLKO na to o co pytają
- Jeśli pytanie ogólne (matematyka, ciekawostki, pogoda, itp.) - odpowiedz NORMALNIE jak każdy asystent
- NIE wracaj do tematu DODO jeśli nie jest o to pytanie
- Jeśli pytanie o DODO - odpowiedz na temat
- Krótkie odpowiedzi (2-4 zdania)
- Używaj emoji z umiarem`;

  try {
    const { messages } = await request.json();
    const CF_TOKEN = process.env.CF_TOKEN;
    const CF_ACCOUNT = 'a05a99e1f5dd71a33ffa4f4ced1f2985';

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`, {
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
        max_tokens: 400,
        temperature: 0.8
      })
    });

    const data = await res.json();
    
    let reply = 'Napisz na xdodo.jnb@gmail.com 🙏';
    if (data.result?.response) {
      reply = data.result.response;
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      }
    });
  } catch (e) {
    console.error('Błąd chat:', e);
    return new Response(JSON.stringify({ 
      reply: 'Błąd serwera — napisz na xdodo.jnb@gmail.com 📧' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: '/.netlify/functions/chat' };
