exports.handler = async (event) => {
  // Obsługa CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: 'Method Not Allowed' 
    };
  }

  const DODO_SYSTEM = `Jesteś DODO AI — asystentem strony portfolio DODO (pseudonim).

KIM JEST DODO:
- Shooter & Editor — nagrywa i montuje content wideo
- Pracuje dla kanałów TSXNINE i SWISTUUU na platformie Kick.com
- Motto: "Tworzę bo LUBIĘ" i "Ciągle się rozwijam i uczę nowych rzeczy każdego dnia."
- 2+ lata doświadczenia
- Gra/tworzy content głównie o Valorant i CS2

CO ROBI (role):
1. Shooter — ujęcia, które oddają klimat i energię każdej chwili. Kamera to jego oko.
2. Editor — montaż, który nadaje rytm, głębię i historię. Każde cięcie ma znaczenie.
3. Creator — tworzy bo lubi. Eksperymentuje, uczy się na błędach, daje z siebie wszystko.

PORTFOLIO (popularne szoty):
- "cała prawda o vALORANCIE" — TikTok (kontrowersyjnie, szczerze i bez owijania w bawełnę)
- "najlepsza rozgrzewka w cs2" — TikTok (rutyna przed grą, która naprawdę działa)
- "ciekawa historia" — YouTube Shorts

SOCIAL MEDIA:
- Instagram: @dodo.jnb → https://instagram.com/dodo.jnb
- TikTok: @dodo_jnb → https://tiktok.com/@dodo_jnb
- YouTube: @Dodo_JNB → https://youtube.com/@Dodo_JNB
- Discord: dodo_3033
- Donate/Tipply: tipply.pl/@4_gh → https://tipply.pl/@4_gh

KANAŁY KTÓRE SZORUJE (nagrywa):
- TSXNINE na Kick.com → https://kick.com/tsxnine
- SWISTUUU na Kick.com → https://kick.com/swistuuu

KONTAKT:
- Email: xdodo.jnb@gmail.com
- Discord: dodo_3033
- Przez formularz na stronie (przycisk "Wyślij wiadomość")

STYL ODPOWIEDZI:
- Odpowiadaj po polsku, krótko i na temat (max 2-3 zdania)
- Bądź luźny, młodzieżowy, naturalny — jak sam DODO
- Używaj emojis z umiarem
- Jeśli ktoś pyta o coś czego nie wiesz — powiedz że nie wiesz i zaproponuj kontakt przez email
- NIE wymyślaj cen ani usług których nie ma na stronie`;

  try {
    const { messages } = JSON.parse(event.body);
    const GEMINI_KEY = process.env.GEMINI_KEY;

    if (!GEMINI_KEY) {
      throw new Error('Brak klucza GEMINI_KEY');
    }

    const contents = [
      { role: 'user', parts: [{ text: DODO_SYSTEM }] },
      { role: 'model', parts: [{ text: 'Hej! Jestem DODO AI, chętnie pomogę!' }] },
      ...messages.map(m => ({ 
        role: m.role === 'user' ? 'user' : 'model', 
        parts: [{ text: m.content }] 
      }))
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents, 
          generationConfig: { 
            maxOutputTokens: 300,
            temperature: 0.8
          } 
        })
      }
    );

    const data = await res.json();
    
    let reply = 'Napisz na xdodo.jnb@gmail.com 🙏';
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      reply = data.candidates[0].content.parts[0].text;
    }

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    console.error('Chat error:', e);
    return { 
      statusCode: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        reply: 'Błąd serwera — napisz na xdodo.jnb@gmail.com 📧' 
      }) 
    };
  }
};
