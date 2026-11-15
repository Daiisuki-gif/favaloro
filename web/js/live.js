/* =====================================================================
   FAVALORO · en vivo: micrófono, voz, brazalete real, chequeo diario y
   avisos cuando cambian los signos.
   Todo gratis y sin instalar nada: usa lo que trae Chrome o Edge.
   - Micrófono: Web Speech API (el navegador transcribe; necesita internet).
   - Voz: speechSynthesis (lee en voz alta los mensajes del acompañante).
   - Brazalete: Web Bluetooth con los servicios estándar de salud
     (pulso 0x180D, termómetro 0x1809, oxímetro 0x1822, presión 0x1810).
   Micrófono y Bluetooth piden abrir la web desde http://localhost
   (usar iniciar.bat), no con doble clic.
   ===================================================================== */
window.FVLive = (() => {
'use strict';
const $ = (s) => document.querySelector(s);
const app = () => window.FVApp;

/* ---------------- voz ---------------- */
// La voz viene activada: el asistente y el acompañante hablan salvo que se apague.
let voice = true;
try { voice = localStorage.getItem('fv_voice') !== '0'; } catch (e) { /* sin almacenamiento */ }
const spoken = {};
let voices = [];
const loadVoices = () => { if ('speechSynthesis' in window) voices = speechSynthesis.getVoices(); };
loadVoices();
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = loadVoices;
/* ---------- Opciones de voz ----------
   Por defecto: una voz femenina en español, un poco más aguda y pausada,
   para que suene amable y tranquila. Se puede elegir otra voz y otro estilo. */
const STYLES = {
  dulce: {n: 'Dulce y amable', pitch: 1.18, rate: 0.94},
  calma: {n: 'Calma', pitch: 1.0, rate: 0.86},
  natural: {n: 'Natural', pitch: 1.0, rate: 1.0},
  agil: {n: 'Ágil', pitch: 1.05, rate: 1.15},
};
let pref = {voice: '', style: 'dulce'};
try { pref = Object.assign(pref, JSON.parse(localStorage.getItem('fv_voice_pref') || '{}')); } catch (e) { /* idem */ }
const savePref = () => { try { localStorage.setItem('fv_voice_pref', JSON.stringify(pref)); } catch (e) { /* idem */ } };
// Nombres de voces femeninas comunes en Windows, Chrome, Edge y Android.
const FEMALE = /(elena|helena|laura|sabina|dalia|paloma|elvira|lupe|paulina|monica|mónica|sofia|sofía|camila|valentina|salome|salomé|catalina|zira|aria|jenny|samantha|susan|hazel|libby|sonia|emma|ava|michelle|female|mujer|google español|google us english|google uk english female)/i;
/* Idioma de la voz: el mismo que la app (inglés por defecto, o español). */
const vlang = () => (window.FVI18N && FVI18N.lang === 'en' ? 'en' : 'es');
const voicesFor = (l) => voices.filter((x) => new RegExp('^' + l, 'i').test(x.lang));
const spanish = () => voicesFor('es');
function bestVoice(l = vlang()) {
  const list = voicesFor(l), want = l === 'en' ? pref.voiceEn : pref.voice;
  if (want) { const v = list.find((x) => x.name === want); if (v) return v; }
  const local = l === 'en' ? /en[-_](US|GB)/i : /es[-_](AR|419|MX|US)/i;
  const rank = (x) => (FEMALE.test(x.name) ? 0 : 2) + (/natural|online|neural/i.test(x.name) ? 0 : 1) + (local.test(x.lang) ? 0 : 0.5);
  return list.slice().sort((a, b) => rank(a) - rank(b))[0];
}
// En inglés, se habla la traducción. Si una frase todavía no tiene traducción, se lee con la voz en español
// (para que no suene mal pronunciada por una voz inglesa).
const looksSpanish = (t) => /[áéíóúñ¿¡]|\b(que|de|la|el|los|las|con|para|por|una|tu|está|hoy)\b/i.test(t);
function sayAs(t) {
  if (vlang() !== 'en') return {t, l: 'es'};
  const en = FVI18N.tr(t);
  return en !== t || !looksSpanish(t) ? {t: en, l: 'en'} : {t, l: 'es'};
}
// Saca símbolos que suenan mal leídos en voz alta.
const clean = (t) => String(t).replace(/[→↗✓·«»*#_]/g, ' ').replace(/CO₂/g, 'CO2').replace(/\s+/g, ' ').trim();
// Habla frase por frase: arranca antes y evita que Chrome corte los textos largos (~15 s).
function speak(t) {
  if (!voice || !('speechSynthesis' in window) || !t) { afterSpeech(); return; }
  const said = sayAs(t); t = said.t;
  const stl = STYLES[pref.style] || STYLES.dulce, v = bestVoice(said.l);
  const parts = (clean(t).match(/[^.!?…]+[.!?…]*/g) || [clean(t)]).map((x) => x.trim()).filter(Boolean);
  // Une frases muy cortas para que no suene entrecortado.
  const chunks = [];
  parts.forEach((p) => { const l = chunks.length - 1; if (l >= 0 && chunks[l].length + p.length < 160) chunks[l] += ' ' + p; else chunks.push(p); });
  if (speechSynthesis.paused) speechSynthesis.resume();
  chunks.forEach((c) => {
    const u = new SpeechSynthesisUtterance(c);
    u.lang = said.l === 'en' ? 'en-US' : 'es-AR'; u.rate = stl.rate; u.pitch = stl.pitch;
    if (v) { u.voice = v; u.lang = v.lang; }
    u.onend = afterSpeech; u.onerror = afterSpeech;
    speechSynthesis.speak(u);
  });
}
/* ---------- Sonido de alerta (generado en el navegador, sin archivos) ----------
   Nivel 1: dos tonos suaves · 2: tres pitidos · 3: alarma de dos tonos repetida. */
let actx = null;
/* Silenciar alertas por un rato: no suenan ni se dicen (siguen visibles en pantalla).
   Una crisis propia del tripulante (su llamada de emergencia) suena igual, por seguridad. */
let muteUntil = 0;
try { muteUntil = +localStorage.getItem('fv_mute') || 0; } catch (e) { /* idem */ }
const muted = () => Date.now() < muteUntil;
function mute(minutes) { muteUntil = minutes ? Date.now() + minutes * 60000 : 0; try { localStorage.setItem('fv_mute', String(muteUntil)); } catch (e) { /* idem */ } if (minutes && 'speechSynthesis' in window) speechSynthesis.cancel(); }
const muteLeft = () => Math.max(0, Math.ceil((muteUntil - Date.now()) / 60000));
function alarm(level, force) {
  if (muted() && !force) return 0;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t0 = actx.currentTime + 0.02;
    const tone = (f, at, dur, vol) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = level >= 3 ? 'square' : 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      o.connect(g).connect(actx.destination); o.start(t0 + at); o.stop(t0 + at + dur + 0.05);
    };
    if (level >= 3) for (let i = 0; i < 4; i++) { tone(880, i * 0.36, 0.16, 0.12); tone(660, i * 0.36 + 0.18, 0.16, 0.12); }
    else if (level === 2) [0, 0.22, 0.44].forEach((a) => tone(988, a, 0.14, 0.18));
    else { tone(660, 0, 0.18, 0.15); tone(880, 0.2, 0.26, 0.15); }
    return level >= 3 ? 1500 : level === 2 ? 700 : 520; // cuánto dura, para hablar después
  } catch (e) { return 0; }
}
// Desbloquea el audio con el primer toque (los navegadores no dejan sonar antes).
addEventListener('pointerdown', () => { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { /* sin audio */ } }, {once: true});
/* Alerta completa: suena y después la dice en voz alta. */
function announce(t, level, force) {
  if (muted() && !force) return;
  const ms = alarm(level || 1, force);
  deafUntil = Date.now() + ms + 400;
  setTimeout(() => speak(t), ms);
}

/* ---------- Modo conversación: habla, escucha y vuelve a hablar ----------
   El micrófono queda abierto todo el tiempo (no se cierra y reabre en cada
   turno, que era lo que generaba la espera). Mientras el asistente habla,
   lo que se oye se descarta para que no se escuche a sí mismo. */
let talk = null; // id del campo donde se conversa ('chatQ' o 'advQ')
function afterSpeech() {
  deafUntil = Date.now() + 250;
  micUi();
  if (talk && !recOn) startRec();
}
function toggleTalk(where, greet) {
  if (talk) {
    talk = null; mode = null;
    if (rec) rec.abort();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    micUi(); return false;
  }
  if (!SR) { micErr = 'Este navegador no reconoce la voz: abrí la web en Chrome o Edge. Podés escribir abajo.'; return false; }
  talk = where; micFor = where; mode = 'talk'; lastHeard = Date.now(); micErr = ''; netFails = 0;
  if (!voice) { voice = true; try { localStorage.setItem('fv_voice', '1'); } catch (e) { /* idem */ } }
  if (recOn) { restart = true; rec.abort(); } else startRec(); // si había un dictado suelto, se reinicia en modo continuo
  speak(greet !== undefined ? greet : (where === 'advQ' ? 'Te escucho. ¿En qué te ayudo?' : 'Dale, charlemos. Contestame en voz alta.'));
  return true;
}
const talking = (target) => talk === target;
function speakNew(kind, log) {
  const from = spoken[kind] ?? log.length - 1;
  log.slice(Math.max(0, from)).filter((m) => m.who === 'bot').forEach((m) => speak(m.t));
  spoken[kind] = log.length;
}
function toggleVoice() {
  voice = !voice;
  try { localStorage.setItem('fv_voice', voice ? '1' : '0'); } catch (e) { /* idem */ }
  if (!voice && 'speechSynthesis' in window) speechSynthesis.cancel();
  if (voice) speak('Listo, te voy a hablar en voz alta.');
}

/* ---------------- micrófono ---------------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, recOn = false;
let mode = null;      // 'talk' = conversación continua · 'once' = un dictado con el botón Micrófono
let micFor = null;    // id del campo que recibe lo dictado
let deafUntil = 0, lastHeard = 0, echo = {}, sentOnce = false, restart = false, micErr = '', netFails = 0;
const PAUSE_MS = 120000; // sin escuchar nada durante 2 minutos, la conversación se pausa sola
const ttsBusy = () => 'speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending);
const deaf = () => mode === 'talk' && (ttsBusy() || Date.now() < deafUntil);
const micLabel = (id) => (recOn && id === micFor ? (deaf() ? 'Hablando…' : 'Escuchando…') : 'Micrófono');
const micOn = (id) => recOn && id === micFor;
function micUi() {
  document.querySelectorAll('[data-mic]').forEach((b) => {
    const id = b.dataset.mic, t = micLabel(id);
    b.setAttribute('aria-pressed', String(micOn(id)));
    if (b.textContent !== t) b.textContent = t;
  });
}
setInterval(() => { if (recOn || mode) micUi(); }, 250);
function hint(t) { const i = document.getElementById(micFor); if (i) i.placeholder = t; }
function submit(t) {
  const input = document.getElementById(micFor);
  if (!input) return;
  input.value = t;
  const form = input.closest('form');
  if (form) form.requestSubmit();
}
function startRec() {
  if (!SR || recOn) return;
  const r = new SR();
  r.lang = window.FVI18N ? FVI18N.speechLang() : 'es-AR'; r.interimResults = true; r.maxAlternatives = 1;
  r.continuous = mode === 'talk';
  echo = {}; sentOnce = false;
  r.onresult = (e) => {
    const input = document.getElementById(micFor);
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i], t = res[0].transcript.trim();
      // Una frase que empezó mientras hablaba el asistente es su propio eco: se descarta entera.
      if (!(i in echo)) echo[i] = deaf();
      if (echo[i] || !t) continue;
      lastHeard = Date.now();
      if (res.isFinal) {
        if (mode === 'once') { if (sentOnce) continue; sentOnce = true; submit(t); r.stop(); }
        else submit(t); // en conversación se envía al instante, sin esperar a que se cierre el micrófono
      } else if (input) input.value = t; // se ve lo que va entendiendo mientras hablás
    }
  };
  // Los errores se muestran como estado del asistente (no en el campo de texto, donde quedaban cortados).
  const stop = (t) => { micErr = t; talk = null; mode = null; if (window.FVApp && FVApp.syncVoice) FVApp.syncVoice(); };
  r.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') stop('Micrófono bloqueado: tocá el candado de la barra de direcciones y permití el micrófono. Mientras, podés escribir.');
    else if (e.error === 'network') { if (++netFails > 2) stop('El reconocimiento de voz no responde (necesita internet y Chrome o Edge). Podés escribir abajo.'); }
    else if (e.error === 'audio-capture') stop('No encuentro el micrófono: revisá que esté conectado. Podés escribir abajo.');
  };
  r.onresult = ((orig) => (e) => { netFails = 0; micErr = ''; orig(e); })(r.onresult);
  r.onend = () => {
    if (rec === r) { rec = null; recOn = false; }
    if (restart) { restart = false; if (mode) startRec(); micUi(); return; }
    if (mode === 'talk' && talk) {
      if (Date.now() - lastHeard > PAUSE_MS) { talk = null; mode = null; speak('Pausé la conversación. Tocá Conversar por voz cuando quieras seguir.'); }
      else startRec(); // Chrome corta el reconocimiento cada tanto: se reabre al instante
    } else {
      if (mode === 'once' && !sentOnce) hint('No te escuché, tocá Micrófono y probá de nuevo.');
      mode = null;
    }
    micUi();
    if (window.FVApp && FVApp.syncVoice) FVApp.syncVoice();
  };
  rec = r; recOn = true; micUi();
  try { r.start(); } catch (err) { rec = null; recOn = false; setTimeout(() => { if (mode) startRec(); }, 150); }
}
// Botón Micrófono: empieza a escuchar al toque y corta la voz del asistente si estaba hablando.
function listen(btn) {
  const id = btn.dataset.mic;
  const input = document.getElementById(id);
  if (!input) return;
  if (!SR) { input.placeholder = 'Este navegador no tiene reconocimiento de voz: usá Chrome o Edge.'; return; }
  const wasTalking = ttsBusy();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (mode === 'talk') { micFor = id; talk = id; deafUntil = 0; lastHeard = Date.now(); micUi(); return; } // ya está escuchando
  if (recOn && micFor === id) { if (!wasTalking) rec.stop(); return; } // segundo toque: termina el dictado
  micFor = id; mode = 'once'; micErr = ''; netFails = 0;
  if (recOn) { restart = true; rec.abort(); } else startRec();
}

/* ---------------- brazalete real por Bluetooth ---------------- */
let band = {name: null, status: ''};
const bandStatus = () => band.status;
function setStatus(t) { band.status = t; const el = $('#bandMsg'); if (el) el.textContent = t; }
// Formatos de la norma IEEE 11073 que usan los servicios de salud de Bluetooth.
function sfloat(dv, o) { const raw = dv.getUint16(o, true); let m = raw & 0x0fff, e = raw >> 12; if (m >= 0x0800) m -= 0x1000; if (e >= 8) e -= 16; return m * Math.pow(10, e); }
function float32(dv, o) { const raw = dv.getUint32(o, true); let m = raw & 0x00ffffff, e = raw >> 24; if (m >= 0x800000) m -= 0x1000000; if (e >= 128) e -= 256; return m * Math.pow(10, e); }
async function sub(server, service, charac, fn) {
  try {
    const s = await server.getPrimaryService(service), c = await s.getCharacteristic(charac);
    c.addEventListener('characteristicvaluechanged', (ev) => fn(ev.target.value));
    await c.startNotifications();
    return true;
  } catch (e) { return false; }
}
async function connectBand(uid) {
  if (!navigator.bluetooth) { setStatus('Este navegador no permite Bluetooth: usá Chrome o Edge y abrí la web con iniciar.bat.'); return; }
  try {
    setStatus('Buscando dispositivos…');
    const dev = await navigator.bluetooth.requestDevice({
      filters: [{services: ['heart_rate']}, {services: ['health_thermometer']}, {services: [0x1822]}, {services: ['blood_pressure']}],
      optionalServices: ['heart_rate', 'health_thermometer', 0x1822, 'blood_pressure', 'battery_service'],
    });
    const srv = await dev.gatt.connect();
    const got = [];
    if (await sub(srv, 'heart_rate', 'heart_rate_measurement', (dv) => { const f = dv.getUint8(0); FV.setReal(uid, 'hr', f & 1 ? dv.getUint16(1, true) : dv.getUint8(1)); })) got.push('pulso');
    if (await sub(srv, 'health_thermometer', 'temperature_measurement', (dv) => { const f = dv.getUint8(0); let t = float32(dv, 1); if (f & 1) t = (t - 32) * 5 / 9; FV.setReal(uid, 'temp', t); })) got.push('temperatura');
    if (await sub(srv, 0x1822, 0x2a5f, (dv) => { const s = sfloat(dv, 1), pr = sfloat(dv, 3); if (s > 50 && s <= 100) FV.setReal(uid, 'spo2', s); if (pr > 20 && pr < 250) FV.setReal(uid, 'hr', pr); })) got.push('oxígeno');
    if (await sub(srv, 'blood_pressure', 'blood_pressure_measurement', (dv) => { const sys = Math.round(sfloat(dv, 1)), dia = Math.round(sfloat(dv, 3)); FV.state.regs.push({id: FV.nid(), uid, ts: Date.now(), sys, dia, src: 'ble'}); FV.save(); })) got.push('presión');
    dev.addEventListener('gattserverdisconnected', () => setStatus('Dispositivo desconectado: volvió la simulación.'));
    band.name = dev.name || 'dispositivo';
    setStatus(got.length ? `Conectado a ${band.name}: ${got.join(', ')} en vivo.` : `${band.name} no ofrece servicios de salud estándar.`);
  } catch (e) {
    setStatus(e && e.name === 'NotFoundError' ? 'No se eligió ningún dispositivo.' : 'No se pudo conectar: ' + (e && e.message ? e.message : 'error') + '.');
  }
}

/* ---------------- avisos del sistema ---------------- */
function notify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return;
  try { new Notification(title, {body, icon: 'media/logo-mark.png'}); } catch (e) { /* algunos navegadores no lo permiten */ }
}

/* ---------------- chequeo diario programado ---------------- */
const dayKey = () => new Date().toDateString();
let lastDaily = null;
function dailyText() {
  const s = app().session(), v = FV.live[s.uid];
  return `Es la hora de tu chequeo diario. Del brazalete ya tengo tu sueño (${FV.f1(v.sleep)} h) y tu pulso (${Math.round(v.hr)} lpm). Charlemos un par de minutos para completar el resto.`;
}
function dailyNow() { if (!app() || !app().session()) return; app().openDaily(dailyText()); notify('FAVALORO · chequeo diario', 'Tu acompañante te espera para completar el chequeo de hoy.'); }
function checkDaily() {
  const a = app(); if (!a || !a.inApp()) return;
  const s = a.session(); if (!s || s.role !== 'crew') return;
  const time = ((FV.state.sched || {})[s.uid]) || '08:00', [h, m] = time.split(':').map(Number), now = new Date();
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
  if (lastDaily === dayKey() || a.doneMindToday()) return;
  lastDaily = dayKey();
  dailyNow();
}

/* ---------------- avisos cuando cambia un signo ---------------- */
// Compara los últimos 5 valores con la referencia de los 20 anteriores. Un aviso por dato cada 3 min.
const cool = {};
function avg(a) { return a.reduce((x, y) => x + y, 0) / a.length; }
function checkChanges() {
  const a = app(); if (!a || !a.inApp()) return;
  const s = a.session(); if (!s) return;
  const ids = s.role === 'crew' ? [s.uid] : s.role === 'med' || s.role === 'cmd' ? FV.CREW.map((c) => c.id) : [];
  ids.forEach((uid) => {
    const v = FV.live[uid], name = FV.CREW.find((c) => c.id === uid).name, out = [];
    const recent = (k) => avg(v.h[k].slice(-5)), base = (k) => avg(v.h[k].slice(-25, -5));
    if (v.h.hr.length < 25) return;
    const hr = recent('hr'), hrB = base('hr');
    if (hr - hrB > 18 || hr > 112) out.push(['hr', `tu pulso subió a ${Math.round(hr)} lpm (antes ${Math.round(hrB)})`, `${name}: el pulso subió a ${Math.round(hr)} lpm (antes ${Math.round(hrB)}).`]);
    if (recent('spo2') < 94) out.push(['spo2', `tu oxígeno bajó a ${Math.round(recent('spo2'))} %`, `${name}: el oxígeno bajó a ${Math.round(recent('spo2'))} %.`]);
    if (recent('temp') > 37.6) out.push(['temp', `tu temperatura está en ${FV.f1(recent('temp'))} °C`, `${name}: temperatura en ${FV.f1(recent('temp'))} °C.`]);
    out.forEach(([k, crewTxt, staffTxt]) => {
      const key = uid + k; if (Date.now() - (cool[key] || 0) < 180000) return; cool[key] = Date.now();
      if (s.role === 'crew') {
        a.proactive(`Noté un cambio: ${crewTxt}. ¿Cómo estás?`, [
          ['Estoy entrenando', null],
          ['Estoy bien', null],
          ['Me siento mal', () => { FV.sos(uid, 'dijo que se siente mal tras un cambio en sus signos'); a.proactive('Avisé al oficial médico y al Comandante. Quedate tranquilo y no estés solo: ya van a contactarte.', [['Entendido', null]], 3); }],
        ], 2);
        notify('FAVALORO · ¿cómo estás?', 'Noté un cambio: ' + crewTxt + '.');
      } else {
        a.proactive(`Cambio detectado: ${staffTxt} ¿Querés llamarlo?`, [['Llamar ahora', () => FV.startCall(uid, s.role)], ['Lo sigo de cerca', null]], 2);
        notify('FAVALORO · cambio en la tripulación', staffTxt);
      }
    });
  });
}
setInterval(() => { checkDaily(); checkChanges(); }, 5000);

/* Panel de opciones de voz (lo dibuja el asistente). */
function voicePanel() {
  const l = vlang(), list = voicesFor(l), cur = bestVoice();
  return `<div class="field"><span class="label">Idioma de la voz y de la app</span><div class="seg" role="radiogroup" aria-label="Idioma" data-noi18n><button type="button" role="radio" data-vlang="en" aria-pressed="${l === 'en'}" lang="en">English</button><button type="button" role="radio" data-vlang="es" aria-pressed="${l === 'es'}" lang="es">Español</button></div></div>
    <div class="field"><label for="vSel" class="label">Voz</label><select id="vSel">${list.length ? list.map((x) => `<option value="${x.name.replace(/"/g, '&quot;')}"${cur && cur.name === x.name ? ' selected' : ''}>${x.name.replace(/</g, '&lt;')} (${x.lang})${FEMALE.test(x.name) ? ' · femenina' : ''}</option>`).join('') : `<option>${l === 'en' ? 'No hay voces en inglés en este navegador' : 'No hay voces en español en este navegador'}</option>`}</select></div>
    <div class="seg" role="radiogroup" aria-label="Estilo de voz">${Object.entries(STYLES).map(([k, s]) => `<button type="button" role="radio" data-vstyle="${k}" aria-pressed="${pref.style === k}">${s.n}</button>`).join('')}</div>
    <div class="row-btns"><button type="button" class="btn-line label" data-vtest>Probar voz</button></div>`;
}
function setVoice(name) { if (vlang() === 'en') pref.voiceEn = name; else pref.voice = name; savePref(); }
// Elegir idioma desde los ajustes del asistente: cambia la voz, el micrófono y toda la app.
document.addEventListener('click', (e) => { const b = e.target.closest('[data-vlang]'); if (b && window.FVI18N) FVI18N.set(b.dataset.vlang); });
document.addEventListener('fv:lang', () => {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  // Si el micrófono estaba escuchando, se reinicia con el idioma nuevo.
  if (rec && recOn) { try { rec.stop(); } catch (err) { /* ya estaba cerrado */ } }
  if (window.FVApp && FVApp.rerender && FVApp.inApp()) FVApp.rerender();
});
function setStyle(k) { if (STYLES[k]) { pref.style = k; savePref(); } }
function testVoice() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const was = voice; voice = true;
  speak('Hola, soy tu asistente de FAVALORO. Estoy acá para acompañarte y cuidarte durante la misión.');
  voice = was;
}

return {speak, speakNew, alarm, announce, mute, muted, muteLeft, toggleVoice, voiceOn: () => voice, listen, micLabel, micOn, micError: () => micErr, connectBand, bandStatus, dailyNow, toggleTalk, talking, voicePanel, setVoice, setStyle, testVoice};
})();
