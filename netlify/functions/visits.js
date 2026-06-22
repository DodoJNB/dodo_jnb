const { getStore } = require('@netlify/blobs');

const ALLOWED_ORIGIN = 'https://dodo-jnb.netlify.app';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Vary': 'Origin'
};

// Klucz = dzisiejsza data w polskiej strefie czasowej (np. "2026-06-22").
// O 0:00 zaczyna się nowy klucz, więc licznik naturalnie "resetuje się"
// każdego dnia — stare dni po prostu zostają zapisane pod swoją datą,
// nic nie jest nadpisywane.
function todayKeyWarsaw() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const store = getStore('visits');
  const key = todayKeyWarsaw();

  try {
    if (event.httpMethod === 'POST') {
      // Nowy odwiedzający w tej sesji -> zwiększamy licznik o 1.
      const current = parseInt((await store.get(key)) || '0', 10);
      const next = current + 1;
      await store.set(key, String(next));
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ count: next }) };
    }

    if (event.httpMethod === 'GET') {
      // Tylko odczyt, bez zwiększania (np. odświeżenie strony w tej samej sesji).
      const current = parseInt((await store.get(key)) || '0', 10);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ count: current }) };
    }

    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ count: null }) };
  } catch (e) {
    console.error('Błąd visits:', e);
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ count: null }) };
  }
};
