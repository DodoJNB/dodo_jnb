export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Dodaję aktualną datę i czas
  const now = new Date();
  const dataInfo = {
    godzina: now.toLocaleTimeString('pl-PL'),
    data: now.toLocaleDateString('pl-PL'),
    dzien: ['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota'][now.getDay()]
  };

  const DODO_SYSTEM = `Jesteś DODO AI — asystentem strony portfolio DODO. Dzisiaj jest ${dataInfo.dzien}, ${dataInfo.data}, godzina ${dataInfo.godzina}.

KIM JEST DODO:
- Twórca shotów (krótkich filmów) na YouTube i TikTok
- 2+ lata doświadczenia, tworzy content o CS2 (Counter-Strike 2)
- Ma 300k views na TikToku i 100k views na YouTube Shorts
- Nagrywa, montuje i tworzy własne shoty na swoje kanały

JEGO KANAŁY:
- YouTube: https://youtube.com/@Dodo_JNB
- TikTok: https://tiktok.com/@dodo_jnb

USŁUGI:
- Pakiet tygodniowy: 125 zł
- Pakiet miesięczny: 500 zł
- Oba zawierają nagranie i montaż shota

SOCIAL MEDIA:
- Instagram: https://instagram.com/4gh._0
- TikTok: https://tiktok.com/@dodo_jnb
- YouTube: https://youtube.com/@Dodo_JNB
- Donate: https://tipply.pl/@4_gh
- Discord: dodo_3033

KANAŁY KTÓRE SZORUJE:
- TSXNINE: https://kick.com/tsxnine
- SWISTUUU: https://kick.com/swistuuu

KONTAKT:
- Email: xdodo.jnb@gmail.com
- Discord: dodo_3033

ZASADY ODPOWIADANIA:
- Mów naturalnie, luźno, po polsku
- Jeśli pytanie ogólne - odpowiedz normalnie
- Jeśli pytanie dotyczy DODO - odpowiedz na temat
- Krótkie odpowiedzi (2-4 zdania)
- Używaj emoji z umiarem
- Linki podawaj jako zwykły adres URL`;

  try {
    const { messages } = await request.json();
    
    // Walidacja - czy messages istnieje i jest tablicą
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ 
        reply: 'Nieprawidłowe zapytanie' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const CF_TOKEN = process.env.CF_TOKEN;
    const CF_ACCOUNT = 'a05a99e1f5dd71a33ffa4f4ced1f2985';

    // Sprawdzenie czy token istnieje
    if (!CF_TOKEN) {
      console.error('Brak CF_TOKEN w zmiennych środowiskowych');
      return new Response(JSON.stringify({ 
        reply: 'Błąd konfiguracji — napisz na xdodo.jnb@gmail.com 📧' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ograniczenie historii do ostatnich 10 wiadomości (oszczędność tokenów)
    const recentMessages = messages.slice(-10);

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CF_TOKEN}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: DODO_SYSTEM },
          ...recentMessages
        ],
        max_tokens: 400,
        temperature: 0.7 // Dodaję temperaturę dla bardziej naturalnych odpowiedzi
      })
    });

    // Sprawdzenie czy odpowiedź jest OK
    if (!res.ok) {
      console.error(`Błąd API: ${res.status}`);
      throw new Error(`API returned ${res.status}`);
    }

    const data = await res.json();
    
    let reply = 'Napisz na xdodo.jnb@gmail.com 🙏';
    if (data.result?.response) {
      reply = data.result.response;
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
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

// Obsługa CORS dla preflight (OPTIONS)
export const config = { 
  path: '/.netlify/functions/chat'
};

// Dodatkowo obsługa OPTIONS
export const handler = async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  return defaultExport(request);
};
