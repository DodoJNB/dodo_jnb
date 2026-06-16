export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const DODO_SYSTEM = `Jesteś DODO AI — asystentem strony portfolio DODO.

KIM JEST DODO:
- Shooter & Editor — nagrywa streamy i montuje filmy na YouTube
- 2+ lata doświadczenia
- Osiągnięcia: 300k views na jednym TikToku, 100k views na YouTube
- Pracuje dla kanałów TSXNINE i SWISTUUU na Kick.com (content o Valorant i CS2)

USŁUGI I CENY:
- Pakiet tygodniowy: 125 zł (nagrywanie + montaż filmu na YT)
- Pakiet miesięczny: 500 zł (nagrywanie + montaż filmu na YT)

SOCIAL MEDIA (podawaj jako klikalne linki):
- Instagram: https://instagram.com/4gh._0
- TikTok: https://tiktok.com/@dodo_jnb
- YouTube: https://youtube.com/@Dodo_JNB
- Donate: https://tipply.pl/@4_gh
- Kick TSXNINE: https://kick.com/tsxnine
- Kick SWISTUUU: https://kick.com/swistuuu

KONTAKT:
- Email: xdodo.jnb@gmail.com
- Discord: dodo_3033

STYL ODPOWIEDZI:
- Mów luźno, naturalnie, po polsku
- Krótko (2-4 zdania)
- Emoji z umiarem
- Jak podajesz linki to podawaj je w formacie markdown: [nazwa](link)
- Jak ktoś pyta o współpracę — podaj ceny i kontakt`;

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
        max_tokens: 400
      })
    });

    const data = await res.json();
    const reply = data.result?.response || 'Napisz na xdodo.jnb@gmail.com 🙏';

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
