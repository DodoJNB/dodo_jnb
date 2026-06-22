/* ════════════════════════════════════════════════════════════
   DODO JNB — app.js
   Cała logika frontendowa (chatbot DODO AI + formularz kontaktowy
   EmailJS + drobne efekty UI) wyniesiona z index.html do osobnego
   pliku, żeby Content-Security-Policy mogło działać bez
   'unsafe-inline' w script-src. To realnie ogranicza skutki
   potencjalnego XSS — nawet gdyby ktoś zdołał wstrzyknąć
   <script>...</script> do strony, przeglądarka go nie wykona,
   bo CSP dopuszcza tylko skrypty z plików tej samej domeny.
   ════════════════════════════════════════════════════════════ */

/* ── DODO CHATBOT ── */
const chatHistory = [];
let chatOpen = false;
let firstOpen = true;

const bubble = document.getElementById('chat-bubble');
const chatWin = document.getElementById('chat-window');
const chatMsgs = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatNotif = document.getElementById('chat-notif');
const chatSuggestions = document.getElementById('chat-suggestions');

function toggleChat() {
  chatOpen = !chatOpen;
  chatWin.classList.toggle('open', chatOpen);
  bubble.classList.toggle('open', chatOpen);
  if (chatOpen) {
    chatNotif.classList.add('hidden');
    if (firstOpen) {
      firstOpen = false;
      setTimeout(() => addBotMsg('Hej! 👋 Jestem DODO AI — mogę powiedzieć Ci wszystko o DODO, jego pasji i jak się z nim skontaktować. O co chodzi?'), 400);
    }
    setTimeout(() => chatInput.focus(), 300);
  }
}

bubble.addEventListener('click', toggleChat);

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Zamienia URL-e, ścieżki strony (np. /polityka.html) i adresy e-mail na klikalne linki.
   Najpierw escapujemy cały tekst (ochrona przed XSS, bo treść pochodzi z odpowiedzi AI),
   a potem wstawiamy tagi <a> tylko wokół fragmentów, które rozpoznaliśmy jako linki. */
function linkify(text) {
  const escaped = escapeHtml(text);
  const urlRe = /(https?:\/\/[^\s<]+[^\s<.,;:!?)'"])/g;
  const pathRe = /(^|[\s(])(\/[a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+)/g;
  const emailRe = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  // Domeny, które bot czasem podaje bez "https://" na początku (np. "instagram.com/dodo.jnb").
  // Dopasowujemy tylko znane, zaufane domeny — nie każdy tekst z kropką, żeby nie
  // robić linków z przypadkowych fragmentów zdania.
  const bareDomainRe = /(^|[\s(])((?:instagram\.com|tiktok\.com|youtube\.com|kick\.com|tipply\.pl|dodo-jnb\.netlify\.app)\/[a-zA-Z0-9_\-\/@.]*[a-zA-Z0-9_\-\/@])/gi;

  return escaped
    .replace(urlRe, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(bareDomainRe, '$1<a href="https://$2" target="_blank" rel="noopener">$2</a>')
    .replace(pathRe, '$1<a href="$2">$2</a>')
    .replace(emailRe, '<a href="mailto:$1">$1</a>');
}

function setBotMsgContent(msgEl, text) {
  msgEl.innerHTML = linkify(text);
}

function addBotMsg(text) {
  hideSuggestions();
  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  chatMsgs.appendChild(typing);
  scrollChat();

  setTimeout(() => {
    typing.remove();
    const msg = document.createElement('div');
    msg.className = 'msg bot';
    setBotMsgContent(msg, text);
    chatMsgs.appendChild(msg);
    chatHistory.push({ role: 'assistant', content: text });
    scrollChat();
  }, 800 + Math.random() * 400);
}

function addUserMsg(text) {
  const msg = document.createElement('div');
  msg.className = 'msg user';
  msg.textContent = text;
  chatMsgs.appendChild(msg);
  chatHistory.push({ role: 'user', content: text });
  scrollChat();
}

function hideSuggestions() {
  chatSuggestions.style.display = 'none';
}

function scrollChat() {
  setTimeout(() => chatMsgs.scrollTop = chatMsgs.scrollHeight, 50);
}

/* Limit długości wiadomości po stronie klienta — zgodny z limitem
   na backendzie (chat.js ucina do 1000 znaków i tak), ale dzięki
   temu user dostaje czytelny komunikat zamiast wysyłać coś, co
   zostanie po cichu obcięte po drodze. */
const CHAT_MAX_LEN = 500;

async function sendMessage(text) {
  text = text.trim();
  if (!text) return;
  if (text.length > CHAT_MAX_LEN) {
    addUserMsg(text.slice(0, CHAT_MAX_LEN) + '…');
    addBotMsg(`Wiadomość jest za długa — skróć ją do ${CHAT_MAX_LEN} znaków 🙏`);
    chatInput.value = '';
    return;
  }

  chatInput.value = '';
  chatSend.disabled = true;
  hideSuggestions();
  addUserMsg(text);

  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  chatMsgs.appendChild(typing);
  scrollChat();

  try {
    const msgs = chatHistory.filter(m => m.role === 'user' || m.role === 'assistant');
    const res = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs })
    });
    const data = await res.json();
    typing.remove();
    const reply = data.reply || 'Coś poszło nie tak — napisz na xdodo.jnb@gmail.com 🙏';
    const msg = document.createElement('div');
    msg.className = 'msg bot';
    setBotMsgContent(msg, reply);
    chatMsgs.appendChild(msg);
    chatHistory.push({ role: 'assistant', content: reply });
    scrollChat();
  } catch (e) {
    typing.remove();
    const msg = document.createElement('div');
    msg.className = 'msg bot';
    setBotMsgContent(msg, 'Ups — napisz na xdodo.jnb@gmail.com lub Discord: dodo_3033');
    chatMsgs.appendChild(msg);
    scrollChat();
  }

  chatSend.disabled = false;
  chatInput.focus();
}

chatSend.addEventListener('click', () => sendMessage(chatInput.value.trim()));
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput.value.trim()); } });

document.querySelectorAll('.chat-suggestion').forEach(btn => {
  btn.addEventListener('click', () => sendMessage(btn.textContent));
});

/* ── EmailJS ──
   EJ_KEY to publiczny klucz EmailJS (Public Key) — z założenia jest
   bezpieczny do umieszczenia w kodzie klienckim, to nie jest sekret
   typu API secret/private key. Prawdziwa ochrona przed nadużyciem
   (np. spamem wysyłanym z innej strony) jest ustawiona w panelu
   EmailJS w "Allowed origins / domains". isAllowedHost() poniżej to
   tylko dodatkowa, kosmetyczna warstwa po stronie klienta. */
const EJ_KEY = "bwW0wLreJo9jRxDSq";
const EJ_SVC = "service_nl2o715";
const EJ_TPL = "template_ro9450w";
const ALLOWED_HOSTS = ["dodo-jnb.netlify.app", "localhost", "127.0.0.1"];
emailjs.init({ publicKey: EJ_KEY });

// Dodatkowa warstwa ochrony: nawet jeśli ktoś skopiuje stronę 1:1 na inną domenę,
// formularz nie wyśle wiadomości przez nasz EmailJS. Główna ochrona i tak powinna
// być ustawiona w panelu EmailJS (Allowed origins / domains).
function isAllowedHost() {
  return ALLOWED_HOSTS.includes(window.location.hostname);
}

/* ── Scroll reveal ── */
const srObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); srObserver.unobserve(e.target); } });
}, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
document.querySelectorAll('.sr').forEach(el => srObserver.observe(el));

/* ── Nav shadow on scroll ── */
window.addEventListener('scroll', () => {
  document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 20);
  document.getElementById('backTop').classList.toggle('show', window.scrollY > 300);
}, { passive: true });

/* ── Back to top ── */
document.getElementById('backTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ── Toast ── */
function toast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── Copy email ── */
document.getElementById('copyEmail').addEventListener('click', () => {
  navigator.clipboard.writeText('xdodo.jnb@gmail.com').then(() => toast('Skopiowano email ✓', 'success'));
});
document.getElementById('discordBtn').addEventListener('click', () => {
  navigator.clipboard.writeText('dodo_3033').then(() => toast('Skopiowano Discord ✓', 'success'));
});

/* ── Cooldown ── */
const COOLDOWN_MS = 60000;
function cooldownLeft() {
  const last = parseInt(sessionStorage.getItem('dodo_msg') || '0');
  const e = Date.now() - last;
  return e < COOLDOWN_MS ? Math.ceil((COOLDOWN_MS - e) / 1000) : 0;
}

/* ── Validation helpers ── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setFieldState(input, state, errMsg) {
  const wrap = input.closest('.field-wrap');
  const err = wrap?.querySelector('.field-error');
  input.classList.remove('valid', 'invalid');
  if (state === 'valid') input.classList.add('valid');
  if (state === 'invalid') {
    input.classList.add('invalid');
    if (err) { err.textContent = errMsg; err.classList.add('show'); }
  } else {
    if (err) err.classList.remove('show');
  }
}

function validateName(val) {
  if (!val) return 'Imię jest wymagane';
  if (val.length < 2) return 'Imię musi mieć co najmniej 2 znaki';
  if (val.length > 50) return 'Imię jest za długie';
  return null;
}

function validateEmail(val) {
  if (!val) return 'Adres email jest wymagany';
  if (!val.includes('@')) return 'Brak znaku @ — to nie wygląda jak email';
  if (!EMAIL_RE.test(val)) return 'Podaj poprawny adres email (np. jan@gmail.com)';
  return null;
}

function validateMsg(val) {
  if (!val) return 'Wiadomość jest wymagana';
  if (val.length < 10) return 'Wiadomość jest za krótka (min. 10 znaków)';
  if (val.length > 1000) return 'Wiadomość jest za długa (max. 1000 znaków)';
  return null;
}

/* ── Open modal ── */
document.getElementById('contactBtn').addEventListener('click', () => {
  const r = cooldownLeft();
  if (r > 0) { toast(`Poczekaj ${r}s przed kolejną wiadomością`, 'error'); return; }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" id="mBox">
      <h3>Wyślij wiadomość</h3>

      <div class="field-wrap">
        <i class="fas fa-user field-icon"></i>
        <input id="mName" type="text" placeholder="Imię / Nick" maxlength="50" autocomplete="name">
        <div class="field-error"></div>
      </div>

      <div class="field-wrap">
        <i class="fas fa-envelope field-icon"></i>
        <input id="mEmail" type="email" placeholder="Adres email (wymagany @)" maxlength="100" autocomplete="email">
        <div class="field-error"></div>
      </div>

      <div class="field-wrap">
        <i class="fas fa-pen field-icon" style="top:15px"></i>
        <textarea id="mMsg" placeholder="Treść wiadomości (min. 10 znaków)" maxlength="1000"></textarea>
        <div class="field-error"></div>
      </div>
      <div class="char-counter" id="charCount">0 / 1000</div>

      <div class="cooldown-bar" id="coolBar"><div class="cooldown-fill" id="coolFill"></div></div>

      <div class="modal-btns">
        <button class="btn-send" id="btnSend">
          <span class="btn-label">Wyślij</span>
          <div class="spinner"></div>
        </button>
        <button class="btn-cancel" id="btnClose">Anuluj</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const mName  = overlay.querySelector('#mName');
  const mEmail = overlay.querySelector('#mEmail');
  const mMsg   = overlay.querySelector('#mMsg');
  const btnSend = overlay.querySelector('#btnSend');
  const charCount = overlay.querySelector('#charCount');

  /* live validation */
  mName.addEventListener('blur', () => {
    const e = validateName(mName.value.trim());
    setFieldState(mName, e ? 'invalid' : 'valid', e);
  });
  mEmail.addEventListener('input', () => {
    const v = mEmail.value.trim();
    if (!v) { setFieldState(mEmail, '', ''); return; }
    const e = validateEmail(v);
    setFieldState(mEmail, e ? 'invalid' : 'valid', e);
  });
  mEmail.addEventListener('blur', () => {
    const e = validateEmail(mEmail.value.trim());
    setFieldState(mEmail, e ? 'invalid' : 'valid', e);
  });
  mMsg.addEventListener('input', () => {
    const len = mMsg.value.length;
    charCount.textContent = `${len} / 1000`;
    charCount.classList.toggle('warn', len > 900);
    if (len >= 10) setFieldState(mMsg, 'valid', null);
  });

  /* close */
  overlay.querySelector('#btnClose').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); } });

  /* send */
  btnSend.addEventListener('click', async () => {
    const name  = mName.value.trim();
    const email = mEmail.value.trim();
    const msg   = mMsg.value.trim();

    const nameErr  = validateName(name);
    const emailErr = validateEmail(email);
    const msgErr   = validateMsg(msg);

    if (nameErr)  setFieldState(mName,  'invalid', nameErr);
    if (emailErr) setFieldState(mEmail, 'invalid', emailErr);
    if (msgErr)   setFieldState(mMsg,   'invalid', msgErr);

    if (nameErr || emailErr || msgErr) {
      const box = overlay.querySelector('#mBox');
      box.classList.add('shake');
      box.addEventListener('animationend', () => box.classList.remove('shake'), { once: true });
      return;
    }

    if (!isAllowedHost()) {
      toast('Formularz działa tylko na oficjalnej stronie DODO.', 'error');
      return;
    }

    /* sending state */
    btnSend.classList.add('loading'); btnSend.disabled = true;

    try {
      const res = await emailjs.send(EJ_SVC, EJ_TPL,
        { from_name: name, from_email: email, message: msg, to_name: 'DODO', reply_to: email });

      if (res.status === 200) {
        sessionStorage.setItem('dodo_msg', Date.now());

        /* success screen */
        overlay.querySelector('#mBox').innerHTML = `
          <div class="modal-success">
            <div class="check"><i class="fas fa-check"></i></div>
            <p><strong>Wysłano!</strong><br>Dziękuję za wiadomość. Odezwę się najszybciej jak mogę 🙌</p>
          </div>`;
        setTimeout(() => overlay.remove(), 2800);
      } else throw new Error();
    } catch {
      btnSend.classList.remove('loading'); btnSend.disabled = false;
      toast('Błąd wysyłki. Spróbuj ponownie.', 'error');
    }
  });
});

/* ── Licznik odwiedzin (dzisiaj) ──
   Pierwsza wizyta w danej sesji przeglądarki -> POST (zwiększa licznik o 1).
   Każde kolejne odświeżenie w tej samej sesji -> GET (tylko odczyt, nie liczy
   tej samej osoby drugi raz). Licznik liczy dzień w strefie Europe/Warsaw
   i sam "resetuje się" o 0:00, bo backend zapisuje go pod kluczem = dzisiejsza data. */
(async () => {
  const el = document.getElementById('visitCounter');
  if (!el) return;

  const alreadyCounted = sessionStorage.getItem('dodo_counted_today');
  try {
    const res = await fetch('/.netlify/functions/visits', {
      method: alreadyCounted ? 'GET' : 'POST'
    });
    const data = await res.json();
    if (!alreadyCounted) sessionStorage.setItem('dodo_counted_today', '1');
    if (data.count != null) {
      el.querySelector('.visit-num').textContent = data.count;
    } else {
      el.style.display = 'none';
    }
  } catch (e) {
    el.style.display = 'none';
  }
})();
