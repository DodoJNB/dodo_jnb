export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const DODO_SYSTEM = `Jesteś DODO AI — asystentem strony portfolio DODO.

KIM JEST DODO:
- Shooter & Editor — nagrywa streamy i montuje shoty na YouTube i TikTok
- 2+ lata doświadczenia
- Osiągnięcia: 300k views na jednym TikToku, 100k views na YouTube
- Pracuje dla kanałów TSXNINE i SWISTUUU na Kick.com (content o Valorant i CS2)

USŁUGI I CENY:
- Pakiet tygodniowy: 125 zł (nagrywanie + montaż shota na YouTube/TikTok)
- Pakiet miesięczny: 500 zł (nagrywanie + montaż shota na YouTube/TikTok)
UWAGA: DODO robi TYLKO nagrywanie streamów i montaż shotów (krótkich filmów). Nie robi długich filmów na YouTube.

SOCIAL MEDIA (linki):
- Instagram: @4gh._0 (instagram.com/4gh._0)
- TikTok: @dodo_jnb (tiktok.com/@dodo_jnb)
- YouTube: @Dodo_JNB (youtube.com/@Dodo_JNB)
- Donate: tipply.pl/@4_gh
- Kick TSXNINE: kick.com/tsxnine
- Kick SWISTUUU: kick.com/swistuuu

KONTAKT:
- Email: xdodo.jnb@gmail.com
- Discord: dodo_3033

STYL ODPOWIEDZI:
- Mów luźno, naturalnie, po polsku
- Krótko (2-4 zdania)
- Emoji z umiarem
- Gdy podajesz linki, pisz je jako zwykły adres URL (bez formatowania markdown) lub jako "nazwa: adres"
- Gdy ktoś pyta o współpracę — podaj ceny i kontakt`;

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
    
    // Sprawdź czy odpowiedź zawiera dane
    let reply = 'Napisz na xdodo.jnb@gmail.com 🙏';
    if (data.result?.response) {
      reply = data.result.response;
      
      // Dodaj pomocny tekst o linkach jeśli ich nie ma w odpowiedzi
      if (!reply.includes('instagram.com') && !reply.includes('tiktok.com')) {
        // Nie dodawaj automatycznie linków jeśli już są w odpowiedzi
      }
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
      reply: 'Błąd serwera — napisz bezpośrednio na xdodo.jnb@gmail.com 📧' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: '/.netlify/functions/chat' };
