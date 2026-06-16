export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const now = new Date();
  const data = {
    godzina: now.toLocaleTimeString('pl-PL'),
    data: now.toLocaleDateString('pl-PL'),
    dzienTygodnia: ['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota'][now.getDay()]
  };

  const DODO_SYSTEM = `Jesteś DODO AI — asystentem strony portfolio DODO. Dzisiaj jest ${data.dzienTygodnia}, ${data.data}, godzina ${data.godzina}.

KIM JEST DODO:
- Twórca shotów na YouTube i TikTok o CS2
- 2+ lata doświadczenia
- 300k views na TikToku, 100k na YouTube

JEGO KANAŁY:
- YouTube: https://youtube.com/@Dodo_JNB
- TikTok: https://tiktok.com/@dodo_jnb

USŁUGI:
- Tygodniowy: 125 zł
- Miesięczny: 500 zł
- Nagranie + montaż shota

SOCIAL MEDIA:
- IG: https://instagram.com/4gh._0
- TT: https://tiktok.com/@dodo_jnb
- YT: https://youtube.com/@Dodo_JNB
- Donate: https://tipply.pl/@4_gh
- Discord: dodo_3033

KANAŁY KTÓRE SZORUJE:
- TSXNINE: https://kick.com/tsxnine
- SWISTUUU: https://kick.com/swistuuu

KONTAKT:
- Email: xdodo.jnb@gmail.com
- Discord: dodo_3033

ZASADY:
- Mów naturalnie, luźno, po polsku
- Jeśli pytanie ogólne - odpowiedz normalnie
- Jeśli o DODO - odpowiedz na temat
- 2-4 zdania, emoji z umiarem`;

  try {
    const { messages } = await request.json();
    const CF_TOKEN = process.env.CF_TOKEN;
    const CF_ACCOUNT = 'a05a99e1f5dd71a33ffa4f4ced1f2985';

    // System prompt z aktualnym czasem
    const systemMsg = { role: 'system', content: DODO_SYSTEM };

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CF_TOKEN}`
      },
      body: JSON.stringify({
        messages: [systemMsg, ...messages],
        max_tokens: 400
      })
    });

    const result = await res.json();
    let reply = result.result?.response || 'Napisz na xdodo.jnb@gmail.com 🙏';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ 
      reply: 'Błąd — napisz na xdodo.jnb@gmail.com 📧' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: '/.netlify/functions/chat' };
