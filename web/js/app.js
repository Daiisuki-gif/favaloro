/* =====================================================================
   FAVALORO · app (ingreso, vistas por rol, asesor y emergencias)
   Todo en la misma página. Estética del inicio: fondo del Earthrise,
   paneles con esquinas de HUD, Michroma para títulos y Plex Mono para datos.
   (Ver la skill favaloro-ui.)
   ===================================================================== */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const S = () => FV.state;
const crew = (id) => FV.CREW.find((c) => c.id === id) || {};
const today = () => FV.dayOf(Date.now());
const pad = (n) => String(n).padStart(2, '0');

/* Estado: punto + texto mono, sin fondos de color. */
const st = (s, txt) => `<span class="st" style="--c:${FV.color(s)}" title="${FV.label(s)}">${txt == null ? FV.label(s) : txt}</span>`;
/* Encabezado de panel: índice + título. */
const ph = (i, t, extra = '') => `<header class="ph"><span class="label">${pad(i)}</span><h3>${t}</h3>${extra}</header>`;
const panel = (i, t, body, cls = '') => `<section class="panel hud ${cls}">${ph(i, t)}${body}</section>`;

/* ---------------- sesión (por pestaña: así dos roles pueden probarse a la vez) ---------------- */
let session = null;
try { session = JSON.parse(sessionStorage.getItem('fv_session') || 'null'); } catch (e) { session = null; }
const setSession = (s) => { session = s; try { sessionStorage.setItem('fv_session', JSON.stringify(s)); } catch (e) { /* sin almacenamiento */ } };

/* ---------------- vistas: inicio · ingreso · app ---------------- */
function show(view) {
  document.body.dataset.view = view;
  $('#landing').hidden = view !== 'landing';
  $('#login').hidden = view !== 'login';
  $('#app').hidden = view !== 'app';
  // El desplazamiento queda activo en todas las vistas: con letra grande o pantallas bajas,
  // el ingreso puede ser más alto que la ventana y hay que poder bajar hasta el botón.
  window.FVScroll.start();
  window.FVScroll.top();
}

/* ---------------- ingreso ---------------- */
let pick = null;
function renderLogin() {
  $('#lgRoles').innerHTML = Object.entries(FV.ROLES).map(([k, r], i) => `
    <li><button type="button" role="radio" aria-checked="${pick === k}" data-role="${k}">
      <span class="label c-earth">${pad(i + 1)}</span><span class="t"><b>${r.n}</b><small>${r.d}</small></span><span class="arrow" aria-hidden="true">→</span>
    </button></li>`).join('');
  $('#lgWho').hidden = pick !== 'crew';
  $('#lgCrew').innerHTML = FV.CREW.map((c) => `<option value="${c.id}">${c.name} · ${c.job}</option>`).join('');
  $('#lgGo').disabled = !pick;
  $('#lgGo').textContent = pick ? 'Entrar como ' + FV.ROLES[pick].n.toLowerCase() + ' →' : 'Elegí un rol';
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-login]');
  if (b) { pick = b.dataset.login || null; renderLogin(); show('login'); setTimeout(() => ($('#lgRoles [aria-checked="true"]') || $('#lgRoles button')).focus(), 50); }
  if (e.target.closest('[data-home]')) show('landing');
});
$('#lgRoles').addEventListener('click', (e) => { const b = e.target.closest('[data-role]'); if (!b) return; pick = b.dataset.role; renderLogin(); $(`[data-role="${pick}"]`).focus(); });
$('#lgGo').addEventListener('click', () => { if (!pick) return; setSession({role: pick, uid: pick === 'crew' ? $('#lgCrew').value : null}); openApp(); });
$('#appOut').addEventListener('click', () => { setSession(null); pick = null; closeAdv(); show('landing'); });

/* ---------------- Vista: tema, tamaño de letra y contraste ----------------
   Oscuro (por defecto, la estética de la misión), claro o automático según el
   dispositivo; letra normal, grande o muy grande; contraste alto para baja visión. */
let a11y = {theme: 'dark', text: 'n', contrast: 0};
try { a11y = Object.assign(a11y, JSON.parse(localStorage.getItem('fv_a11y') || '{}')); } catch (e) { /* idem */ }
function applyA11y() {
  const d = document.documentElement;
  const th = a11y.theme === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : a11y.theme;
  d.dataset.theme = th; d.dataset.text = a11y.text; d.dataset.contrast = a11y.contrast ? 'high' : 'n';
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = th === 'light' && document.body.dataset.view !== 'landing' ? '#eef1f6' : '#05070c';
  $$('#a11y [data-set]').forEach((b) => b.setAttribute('aria-checked', String(String(a11y[b.dataset.set]) === b.dataset.val)));
  try { localStorage.setItem('fv_a11y', JSON.stringify(a11y)); } catch (e) { /* idem */ }
}
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (a11y.theme === 'auto') applyA11y(); });
let a11yFrom = null;
function toggleA11y(btn) {
  const p = $('#a11y'), open = p.hidden;
  p.hidden = !open; $$('[data-a11y]').forEach((b) => b.setAttribute('aria-expanded', String(open)));
  if (open) { a11yFrom = btn; applyA11y(); const r = btn.getBoundingClientRect(); p.style.top = Math.round(r.bottom + 8) + 'px'; p.querySelector('[aria-checked="true"]').focus(); }
  else if (a11yFrom) a11yFrom.focus();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-a11y]'); if (b) { toggleA11y(b); return; }
  if (e.target.closest('[data-a11y-close]')) { toggleA11y(a11yFrom); return; }
  const s = e.target.closest('#a11y [data-set]');
  if (s) { a11y[s.dataset.set] = s.dataset.set === 'contrast' ? +s.dataset.val : s.dataset.val; applyA11y(); if (session && document.body.dataset.view === 'app') render(); return; }
  if (!$('#a11y').hidden && !e.target.closest('#a11y')) toggleA11y(a11yFrom);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#a11y').hidden) toggleA11y(a11yFrom); });
applyA11y();

/* ---------------- app ---------------- */
const TABS = {
  crew: [['hoy', 'Mi día'], ['mente', 'Mente y estrés'], ['tests', 'Tests'], ['familia', 'Familia y diario'], ['nutri', 'Nutrición'], ['reg', 'Registros'], ['hist', 'Historial']],
  cmd: [['rep', 'Parte del día'], ['apto', '¿Apto para la tarea?'], ['reportes', 'Reportes'], ['dec', 'Decisiones'], ['emg', 'Emergencias'], ['evo', 'Evolución']],
  esp: [['env', 'Entorno'], ['nave', 'Nave'], ['eclss', 'Soporte vital'], ['rad', 'Radiación solar'], ['risk', 'Riesgos']],
  med: [['crew', 'Tripulación'], ['ficha', 'Ficha clínica'], ['mente', 'Mente'], ['nutri', 'Nutrición'], ['kit', 'Botiquín'], ['tierra', 'Consulta Tierra'], ['plan', 'Plan NASA'], ['alert', 'Alertas']],
};
const LIVE = new Set(['hoy', 'rep', 'apto', 'env', 'nave', 'risk', 'crew', 'ficha', 'alert', 'emg', 'tierra']);
let tab = null, medSel = 'a3';

function openApp() {
  if (!session) return show('landing');
  tab = TABS[session.role][0][0];
  $('#appRoleK').textContent = FV.ROLES[session.role].n;
  $('#appRole').textContent = session.uid ? crew(session.uid).name : 'Base lunar · tripulación de 3';
  $('#appSos').hidden = session.role !== 'crew';
  show('app');
  render();
  renderAdvBtn();
}
function renderTabs() {
  $('#appTabs').innerHTML = TABS[session.role].map(([k, t], i) => `<button type="button" data-tab="${k}" aria-current="${k === tab ? 'page' : 'false'}"><span>${pad(i + 1)}</span>${t}</button>`).join('');
}
$('#appTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; render(); $('#appMain').focus({preventScroll: true}); window.scrollTo(0, 0); });

/* Actualiza solo lo que cambió (sin rearmar toda la pantalla): así no parpadea,
   no se pierde el scroll y las animaciones de entrada no se repiten. */
function morph(el, html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  patchKids(el, tpl.content);
}
function patchKids(a, b) {
  const an = [...a.childNodes], bn = [...b.childNodes];
  bn.forEach((y, i) => {
    const x = an[i];
    if (!x) { a.appendChild(y); return; }
    if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) { a.replaceChild(y, x); return; }
    if (x.nodeType !== 1) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; return; }
    [...x.attributes].forEach((at) => { if (!y.hasAttribute(at.name)) x.removeAttribute(at.name); });
    [...y.attributes].forEach((at) => { if (at.name !== 'value' && x.getAttribute(at.name) !== at.value) x.setAttribute(at.name, at.value); });
    if (x.tagName === 'INPUT' || x.tagName === 'TEXTAREA') return; // lo que la persona está escribiendo no se toca
    if (x.tagName === 'SELECT') { const v = x.value; patchKids(x, y); x.value = v; return; }
    patchKids(x, y);
  });
  for (let i = an.length - 1; i >= bn.length; i--) a.removeChild(an[i]);
}
let shownTab = null;
function render() {
  renderTabs();
  const fn = VIEWS[session.role + ':' + tab], key = session.role + ':' + tab + ':' + (session.uid || '');
  const fresh = shownTab !== key; shownTab = key;
  // La animación de entrada solo al cambiar de pestaña; después, actualización en el lugar.
  const html = callBanner() + `<div class="view${fresh ? '' : ' live'}">${fn ? fn() : ''}</div>`;
  if (fresh) $('#appMain').innerHTML = html; else morph($('#appMain'), html);
  if (session.role === 'crew' && tab === 'mente') mindEval();
  checkBadges();
}
function refresh() {
  if (document.body.dataset.view !== 'app' || !session) return;
  renderAdvBtn();
  if (!$('#adv').hidden && !$('#adv').contains(document.activeElement)) renderAdv();
  checkIncoming();
  if (!LIVE.has(tab)) { const b = $('#callBanner'), nb = callBanner(); if (b && b.outerHTML !== nb) b.outerHTML = nb; return; }
  const a = document.activeElement;
  if ($('#appMain').contains(a) && a.matches('input,select,textarea')) return;
  render();
}
setInterval(() => {
  const now = new Date();
  $('#appClock').textContent = 'Día 142 · ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ' · ' + FV.envOf().n;
}, 1000);
setInterval(refresh, 2000);
FV.onChange(() => { if (document.body.dataset.view === 'app') { renderAdvBtn(); checkIncoming(); const b = $('#callBanner'), nb = callBanner(); if (b && b.outerHTML !== nb) b.outerHTML = nb; } });

/* ---------------- piezas visuales ---------------- */
function spark(arr, c) {
  if (!arr || arr.length < 2) return '';
  const lo = Math.min(...arr), hi = Math.max(...arr), sp = hi - lo || 1;
  const line = arr.map((v, i) => (i * 100 / (arr.length - 1)).toFixed(1) + ',' + (28 - (v - lo) / sp * 24).toFixed(1)).join(' ');
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="${line}" fill="none" style="stroke:${c}" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>`;
}
/* Lectura de telemetría: etiqueta, número grande, unidad y rango. */
function readout(x, h) {
  return `<div class="ro"><div class="ro-k"><span class="label">${x.n}</span>${st(x.s, '')}</div><div class="ro-v">${x.val}<small>${x.u}</small></div>${h ? spark(h, 'var(--mut)') : ''}<div class="ro-r label">${x.src} · ${x.r}</div></div>`;
}
/* Medidor de malestar: número grande y una escala fina con los umbrales 25 · 45 · 65. */
function meter(idx, s) {
  const v = idx ?? 0;
  return `<div class="meter" role="img" aria-label="Malestar ${idx ?? 'sin dato'} de 100">
    <div class="m-num"><b style="color:${FV.color(s)}">${idx ?? '—'}</b><span class="label">/ 100 malestar</span></div>
    <div class="m-scale"><i style="width:${v}%;background:${FV.color(s)}"></i>${[25, 45, 65].map((t) => `<em style="left:${t}%"></em>`).join('')}</div>
    <div class="m-ticks label"><span>0</span><span style="left:25%">25</span><span style="left:45%">45</span><span style="left:65%">65</span><span style="left:100%">100</span></div>
  </div>`;
}
const PAL = ['#ffffff', '#6fb6ff', '#f2e6c9', '#8cc56b', '#ff7f6b'];
function chart(series, days, H, label) {
  const W = 640, L = 34, Rr = 12, T = 10, B = 26, pw = W - L - Rr, ph2 = H - T - B;
  const X = (i) => L + (days.length < 2 ? pw / 2 : i * pw / (days.length - 1)), Y = (v) => T + ph2 * (1 - v / 100);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label || 'Evolución por día')}">`;
  [25, 45, 65].forEach((v) => { s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:rgb(var(--fg-rgb) / .14)" stroke-dasharray="2 5"/><text x="${W - Rr}" y="${Y(v) - 4}" text-anchor="end" font-family="IBM Plex Mono" font-size="9" letter-spacing="1" style="fill:var(--none)">${v === 25 ? 'VIGILAR' : v === 45 ? 'ALERTA' : 'EMERGENCIA'}</text>`; });
  [0, 50, 100].forEach((v) => { s += `<text x="${L - 8}" y="${Y(v) + 3}" text-anchor="end" font-family="IBM Plex Mono" font-size="9" style="fill:var(--none)">${v}</text>`; });
  s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(0)}" y2="${Y(0)}" style="stroke:rgb(var(--fg-rgb) / .2)"/>`;
  const step = Math.ceil(days.length / 8);
  days.forEach((d, i) => { if (i % step === 0) s += `<text x="${X(i)}" y="${H - 8}" text-anchor="middle" font-family="IBM Plex Mono" font-size="9" style="fill:var(--none)">${FV.dl(d)}</text>`; });
  series.forEach((se) => {
    if (se.pts.length > 1) s += `<polyline fill="none" style="stroke:${se.color}" stroke-width="1.5" stroke-linejoin="round" points="${se.pts.map((p) => X(p.i) + ',' + Y(p.v)).join(' ')}"/>`;
    se.pts.forEach((p) => { s += `<circle cx="${X(p.i)}" cy="${Y(p.v)}" r="2.5" fill="${se.color}"><title>${esc(se.name)} · ${FV.dl(days[p.i])} · ${p.v}</title></circle>`; });
  });
  return s + '</svg>' + `<div class="legend">${series.map((x) => `<span class="label"><i style="background:${x.color}"></i>${esc(x.name)}</span>`).join('')}</div>`;
}
function daily(id) { const m = {}; FV.checksOf(id).forEach((c) => { m[FV.dayOf(c.ts)] = c; }); return m; }
/* Ingesta de 14 días: barras finas, más altas = comió menos. */
function strip14(id) {
  const dq = {}; FV.nutriOf(id, 'dq').forEach((c) => { dq[FV.dayOf(c.ts)] = c; });
  let h = '<div class="strip" role="img" aria-label="Ingesta de los últimos 14 días">';
  for (let i = 13; i >= 0; i--) { const k = FV.dayOf(Date.now() - i * FV.DAY), c = dq[k], v = c ? c.ap + c.me + c.fl : null; h += `<i title="${FV.dl(k)}${v === null ? ' · sin chequeo' : ' · ' + v + ' de 6'}" style="height:${v === null ? 4 : 10 + v * 12}px;background:${v === null ? 'rgb(var(--fg-rgb) / .12)' : v <= 1 ? 'var(--ok)' : v <= 3 ? 'var(--warn)' : 'var(--bad)'}"></i>`; }
  return h + '</div><p class="note">Últimos 14 días. Barra baja y verde: comió normal. Alta y roja: comió muy poco.</p>';
}
function domains(ds) {
  return '<dl class="doms">' + Object.keys(FV.DOM).map((d) => { const v = ds ? ds[d] : undefined; const s = v === undefined ? null : v <= 25 ? 0 : v <= 45 ? 1 : 2; return `<div><dt class="label">${FV.DOM[d][0]}</dt><dd><span class="bar"><i style="width:${v === undefined ? 0 : Math.round(v)}%;background:${FV.color(s)}"></i></span><b>${v === undefined ? '—' : Math.round(v)}</b></dd></div>`; }).join('') + '</dl>';
}
function crewRow(m, act) {
  const c = FV.combined(m.id), I = c.I, ch = c.c;
  return `<article class="crow" style="--c:${FV.color(c.s)}">
    <div class="cr-n"><span class="label c-earth">${m.id.toUpperCase()}</span><b>${m.name}</b><small>${m.job}</small></div>
    <div class="cr-s">${st(c.s)}${c.escalated ? '<span class="label dim">escalado por señales cruzadas</span>' : ''}</div>
    <dl class="cr-v"><div><dt class="label">Pulso</dt><dd>${I.hr.val}</dd></div><div><dt class="label">SpO₂</dt><dd>${I.spo2.val}%</dd></div><div><dt class="label">Temp</dt><dd>${I.temp.val}°</dd></div><div><dt class="label">Sueño</dt><dd>${I.sleep.val} h</dd></div><div><dt class="label">Mente</dt><dd style="color:${FV.color(ch ? ch.s : null)}">${ch ? ch.idx : '—'}</dd></div><div><dt class="label">Nutrición</dt><dd style="color:${FV.color(c.n.s)}">${FV.label(c.n.s)}</dd></div></dl>
    ${c.f.length ? `<p class="cr-f">Señales: ${c.f.join(' + ')}</p>` : ''}
    <div class="cr-a">${act === 'med' ? `<button type="button" class="btn-line label" data-med="${m.id}" data-focus="m${m.id}">Ficha →</button>` : ''}${act ? `<button type="button" class="btn-line label c-bad" data-call="${m.id}" data-focus="c${m.id}">Llamar</button>` : ''}</div>
  </article>`;
}

/* ---------------- llamadas de emergencia ---------------- */
const CALL_TXT = {ringing: 'Llamando', noresp: 'Sin respuesta · escalando', help: 'Pidió ayuda', ok: 'Respondió bien'};
function callBanner() {
  if (!session || session.role === 'crew') return '<div id="callBanner"></div>';
  const cs = FV.activeCalls();
  if (!cs.length) return '<div id="callBanner"></div>';
  return `<div id="callBanner" class="calls">${cs.map((c) => {
    const left = Math.max(0, Math.ceil((c.deadline - Date.now()) / 1000));
    return `<section class="callcase hud" style="--c:${c.status === 'ringing' ? 'var(--warn)' : 'var(--bad)'}">
      <div class="cc-top"><span class="label">${c.from === 'self' ? 'Pedido de ayuda' : c.from === 'asistente' ? 'Aviso del asistente' : 'Llamada de emergencia'}</span><b>${crew(c.uid).name}</b>${st(c.status === 'ringing' ? 1 : 2, (c.from === 'asistente' && c.status === 'help' ? 'Ir a verlo' : CALL_TXT[c.status]) +(c.status === 'ringing' ? ' · ' + left + ' s' : ''))}<button type="button" class="btn-line label" data-mute>${window.FVLive && FVLive.muted() ? 'Sonido: silenciado' : 'Silenciar 15 min'}</button><button type="button" class="btn-line label" data-close-call="${c.id}">Cerrar caso</button></div>
      ${c.crisis ? `<p class="cc-crisis"><b>Crisis detectada:</b> ${esc(c.reason)}</p>` : ''}
      ${c.status === 'ringing' ? `<div class="cc-count" style="--p:${Math.max(0, Math.min(1, (c.deadline - Date.now()) / (FV.CALL_S * 1000)))}"><b>${left}</b><span class="label">segundos para que responda</span><i></i></div>` : ''}
      ${c.steps.length ? `<ol class="steps-t">${c.steps.map((s) => `<li><span class="label dim">${new Date(s.ts).toLocaleTimeString('es-AR')}</span>${esc(s.t)}</li>`).join('')}</ol>` : `<p class="note">Esperando respuesta de ${crew(c.uid).name}. Si no contesta en ${FV.CALL_S} s, FAVALORO avisa al compañero más cercano, al oficial médico y a Control de Misión. Para probarlo, abrí otra pestaña como ${crew(c.uid).name}.</p>`}
    </section>`;
  }).join('')}</div>`;
}
let callTimer = null;
function toggleMute() {
  if (!window.FVLive) return;
  FVLive.mute(FVLive.muted() ? 0 : 15);
  syncAdvVoice(); morphBanner();
}
/* ---------- Crisis: parámetros malos → llamada con cuenta regresiva en voz ----------
   Si un tripulante tiene un parámetro crítico (oxígeno bajo, emergencia de salud mental),
   el asistente lo llama al instante. Mientras no responde, en su pantalla y en la de todos
   suena la alarma y se cuenta en voz alta. Si no contesta a tiempo, escala solo. */
const CRISIS = /^(spo2|mind)-/;
function crisisCheck(all) {
  all.filter((p) => p.lvl >= 3 && CRISIS.test(p.id) && !p.esc).forEach((p) => {
    const m = FV.CREW.find((c) => c.name === p.who); if (!m) return;
    if (FV.activeCalls().some((c) => c.uid === m.id)) return;
    FV.protoEscalate(p.id);
    FV.startCall(m.id, 'asistente', p.t.split(' · ')[0] + ': ' + p.why);
  });
}
const SAY_AT = new Set([30, 20, 10, 5, 4, 3, 2, 1]);
const spokenAt = {};
function crisisTick() {
  if (!session || document.body.dataset.view !== 'app' || !window.FVLive) return;
  const now = Date.now();
  FV.activeCalls().filter((c) => c.status === 'ringing').forEach((c) => {
    const mine = session.role === 'crew' && c.uid === session.uid;
    if (session.role === 'crew' && !mine) return;
    const left = Math.max(0, Math.ceil((c.deadline - now) / 1000)), key = c.id + ':' + left;
    if (!SAY_AT.has(left) || spokenAt[key]) return;
    spokenAt[key] = 1;
    const force = mine && c.crisis; // a la persona en crisis le suena aunque haya silenciado
    if (left === 30 || left === 20 || left === 10) FVLive.alarm(left === 10 ? 3 : 2, force);
    if (FVLive.muted() && !force) return;
    if (left <= 5) FVLive.speak(String(left));
    else FVLive.speak(mine ? `Quedan ${left} segundos para responder.` : `${crew(c.uid).name} no responde. Quedan ${left} segundos.`);
  });
  if (session.role !== 'crew') morphBanner();
}
// Actualiza el cartel de llamadas en el lugar (la cuenta regresiva avanza sin rearmarlo).
function morphBanner() {
  const b = $('#callBanner'); if (!b) return;
  const t = document.createElement('template'); t.innerHTML = callBanner();
  const n = t.content.firstElementChild;
  [...b.attributes].forEach((a) => { if (!n.hasAttribute(a.name)) b.removeAttribute(a.name); });
  [...n.attributes].forEach((a) => { if (b.getAttribute(a.name) !== a.value) b.setAttribute(a.name, a.value); });
  patchKids(b, n);
}
setInterval(crisisTick, 1000);
/* Al Comandante y al oficial médico: cada pedido de ayuda o llamada sin respuesta
   suena como alarma y se dice en voz alta, aunque estén en otra pestaña de la app. */
const callSeen = new Set();
function announceCalls() {
  if (!session || session.role === 'crew' || document.body.dataset.view !== 'app') return;
  FV.activeCalls().forEach((c) => {
    const name = crew(c.uid).name;
    if (c.status === 'ringing' && c.crisis) {
      const key = c.id + ':crisis'; if (callSeen.has(key)) return; callSeen.add(key);
      proactive(`Crisis: ${name}. ${c.reason} El asistente lo está llamando: si no responde en ${FV.CALL_S} segundos, se avisa al compañero más cercano y a Control de Misión.`, [['Voy en camino', null]], 3);
      return;
    }
    if (c.status !== 'help' && c.status !== 'noresp') return;
    const key = c.id + ':' + c.status; if (callSeen.has(key)) return; callSeen.add(key);
    const t = c.status === 'noresp' ? `Alerta: ${name} no respondió la llamada. Ya se avisó al compañero más cercano. Hay que ir a verlo.` : c.reason ? `Alerta: el asistente avisa por ${name}: ${c.reason}` : `Alerta: ${name} pidió ayuda. El oficial médico tiene que ir a verlo ahora.`;
    proactive(t, [['Llamar a ' + name, () => FV.startCall(c.uid, session.role)], ['Voy en camino', null]], 3);
  });
}
function checkIncoming() {
  const box = $('#call');
  announceCalls();
  if (!session || session.role !== 'crew') { box.hidden = true; return; }
  const c = FV.activeCalls().find((x) => x.uid === session.uid && x.status === 'ringing');
  if (!c) { if (!box.hidden) { box.hidden = true; clearInterval(callTimer); } return; }
  if (box.hidden) {
    box.hidden = false; box.dataset.id = c.id;
    $('#callFrom').textContent = c.crisis ? 'El asistente detectó: ' + c.reason : 'Te llama: ' + (FV.ROLES[c.from] || {n: c.from === 'asistente' ? 'el asistente' : 'la tripulación'}).n + '.';
    $('#callOk').focus();
    if (window.FVLive) FVLive.announce((c.crisis ? 'Atención. Detecté valores peligrosos. ' : 'Llamada de emergencia. ') + '¿Estás bien? Tocá «Estoy bien» o «Necesito ayuda». Tenés ' + FV.CALL_S + ' segundos.', 3, c.crisis);
    clearInterval(callTimer);
    callTimer = setInterval(() => { const l = Math.max(0, Math.ceil((c.deadline - Date.now()) / 1000)); $('#callLeft').textContent = l; if (!l) { box.hidden = true; clearInterval(callTimer); } }, 250);
  }
}
$('#callOk').addEventListener('click', () => { FV.answerCall($('#call').dataset.id, true); $('#call').hidden = true; clearInterval(callTimer); });
$('#callHelp').addEventListener('click', () => { FV.answerCall($('#call').dataset.id, false); $('#call').hidden = true; clearInterval(callTimer); openAdv(); });
$('#appSos').addEventListener('click', () => { FV.sos(session.uid); $('#appSos').textContent = 'Ayuda pedida ✓'; openAdv(); setTimeout(() => { $('#appSos').textContent = 'Pedir ayuda'; }, 6000); });

/* ======================================================================
   VISTAS
   ====================================================================== */
const VIEWS = {};
const hello = (k, t, sub = '') => `<div class="hello"><p class="label c-earth">${k}</p><h1>${t}</h1>${sub ? `<p class="hello-s">${sub}</p>` : ''}</div>`;

/* ---------------- TRIPULANTE ---------------- */
const doneToday = (id) => {
  const t = today();
  return {
    band: true,
    mind: FV.checksOf(id).some((c) => FV.dayOf(c.ts) === t && !c.demo),
    food: FV.nutriOf(id, 'dq').some((c) => FV.dayOf(c.ts) === t && !c.demo),
    reg: S().regs.some((r) => r.uid === id && FV.dayOf(r.ts) === t && !r.demo && r.glu != null),
    react: S().regs.some((r) => r.uid === id && FV.dayOf(r.ts) === t && !r.demo && r.react != null),
  };
};
/* ---------- Rachas, niveles y logros (gamificación) ----------
   Premian el hábito de cuidarse (medirse, registrar, hacer los tests), nunca el resultado:
   un valor fuera de rango no resta puntos, para que nadie esconda un síntoma por no perder la racha. */
const LEVELS = [[0, 'Cadete'], [200, 'Tripulante en entrenamiento'], [450, 'Especialista en autocuidado'], [800, 'Guardián de su salud'], [1300, 'Comandante de su salud']];
function gameOf(id) {
  const DAY = 864e5, t0 = Date.now(), d = doneToday(id);
  const todayN = Object.values(d).filter(Boolean).length;
  const live = (k) => FV.testsOf(id, k).filter((x) => !x.demo).length;
  // Días con algún registro (los anteriores incluyen la historia de la misión).
  const days = new Set([...FV.checksOf(id).map((c) => FV.dayOf(c.ts)), ...S().regs.filter((r) => r.uid === id).map((r) => FV.dayOf(r.ts))]);
  days.delete(today());
  const todayOk = d.mind || d.food || d.reg || d.react;
  if (todayOk) days.add(today());
  let streak = 0, t = todayOk ? t0 : t0 - DAY;
  while (days.has(FV.dayOf(t))) { streak++; t -= DAY; }
  const mindDays = new Set(FV.checksOf(id).map((c) => FV.dayOf(c.ts)));
  const week = Array.from({length: 7}, (_, i) => mindDays.has(FV.dayOf(t0 - (6 - i) * DAY)));
  const weekN = week.filter(Boolean).length;
  const diaryN = ((fam().diary || {})[id] || []).length;
  const pts = days.size * 10 + FV.checksOf(id).length * 5 + FV.testsOf(id).length * 15 + diaryN * 10 + todayN * 5 + Math.min(streak, 30) * 5;
  const li = LEVELS.reduce((a, l, i) => (pts >= l[0] ? i : a), 0), nx = LEVELS[li + 1];
  const B = (k, ico, n, how, cur, goal, go) => ({k, ico, n, how, cur: Math.min(cur, goal), goal, ok: cur >= goal, go});
  const badges = [
    B('dia', '5', 'Día completo', 'Completá los 5 registros de hoy.', todayN, 5, null),
    B('r3', '3', 'Tres días seguidos', 'Registrá algo 3 días seguidos.', streak, 3, null),
    B('r7', '7', 'Semana en órbita', 'Mantené la racha 7 días.', streak, 7, null),
    B('mente', '◎', 'Mente en orden', 'Hacé 10 chequeos de mente y estrés.', FV.checksOf(id).length, 10, 'mente'),
    B('vista', '◉', 'Ojo de halcón', 'Hacé el test de visión (rejilla de Amsler).', live('vis'), 1, 'tests'),
    B('cabeza', '∴', 'Cabeza despierta', 'Hacé los tests de memoria y de atención.', Math.min(live('mem'), 1) + Math.min(live('att'), 1), 2, 'tests'),
    B('oido', '≋', 'Oído atento', 'Hacé el test de audición.', live('aud'), 1, 'tests'),
    B('diario', '✎', 'Diario de a bordo', 'Escribí 3 entradas en tu diario.', diaryN, 3, 'familia'),
  ];
  return {streak, todayOk, week, weekN, pts, lvl: LEVELS[li][1], next: nx, base: LEVELS[li][0], badges};
}
function gamePanel(id, i) {
  const g = gameOf(id), got = g.badges.filter((b) => b.ok).length;
  const lvP = g.next ? Math.round((g.pts - g.base) / (g.next[0] - g.base) * 100) : 100;
  const DN = ['D', 'L', 'M', 'M', 'J', 'V', 'S'], wd = (k) => DN[new Date(Date.now() - (6 - k) * 864e5).getDay()];
  const ring = (b) => { const p = b.cur / b.goal, C = 2 * Math.PI * 20; return `<svg viewBox="0 0 48 48" class="gm-ring" aria-hidden="true"><circle cx="24" cy="24" r="20" class="gm-r0"/><circle cx="24" cy="24" r="20" class="gm-r1" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 24 24)"/><text x="24" y="29" text-anchor="middle">${b.ico}</text></svg>`; };
  return panel(i, `Tus logros <span class="livetag label">${got} de ${g.badges.length}</span>`,
    `<div class="gm-top">
      <div class="gm-k"><p class="label dim">Racha</p><p class="gm-big"><b>${g.streak}</b> ${g.streak === 1 ? 'día' : 'días'} seguidos</p><p class="note">${g.todayOk ? 'Hoy ya sumaste ✓' : `Hacé un registro hoy para llegar a ${g.streak + 1}.`}</p></div>
      <div class="gm-k"><p class="label dim">Nivel</p><p class="gm-big">${g.lvl}</p><div class="prog"><i style="width:${lvP}%"></i></div><p class="note">${g.pts} puntos${g.next ? ` · faltan ${g.next[0] - g.pts} para «${g.next[1]}»` : ' · nivel máximo'}</p></div>
      <div class="gm-k"><p class="label dim">Misión de la semana</p><p class="gm-big">Mente y estrés <b>${Math.min(g.weekN, 5)}</b>/5 días</p><ol class="gm-week" aria-label="Chequeos de mente de los últimos 7 días">${g.week.map((x, k) => `<li class="${x ? 'on' : ''}" title="${x ? 'Hecho' : 'Sin chequeo'}"><span class="label">${wd(k)}</span></li>`).join('')}</ol></div>
    </div>
    <ul class="gm-badges">${g.badges.map((b) => `<li class="${b.ok ? 'ok' : ''}">${ring(b)}<div><b>${b.n}</b><small>${b.ok ? 'Conseguido' : b.how + ` · ${b.cur}/${b.goal}`}</small></div>${!b.ok && b.go ? `<button type="button" class="btn-line label" data-tab="${b.go}">Ir →</button>` : ''}</li>`).join('')}</ul>
    <p class="note">Los puntos premian el hábito de cuidarte (medirte, registrar, hacer los tests), nunca el resultado: un valor fuera de rango no resta. Si algo anda mal, avisalo: eso también es cuidarte.</p>`);
}
// Aviso breve cuando se gana un logro nuevo (la primera vez solo se guarda lo que ya tenía).
function checkBadges() {
  if (!session || session.role !== 'crew') return;
  const id = session.uid, s = S(); s.badges = s.badges || {};
  const now = gameOf(id).badges.filter((b) => b.ok).map((b) => b.k), had = s.badges[id];
  if (!had) { s.badges[id] = now; FV.save(); return; }
  const fresh = now.filter((k) => !had.includes(k));
  if (!fresh.length) return;
  s.badges[id] = [...new Set([...had, ...now])]; FV.save();
  const b = gameOf(id).badges.find((x) => x.k === fresh[0]);
  toast('Logro desbloqueado: ' + b.n, b.ico);
  if (window.FVLive && !FVLive.muted()) FVLive.speak('¡Bien! Lograste: ' + b.n + '.');
}
function toast(t, ico) {
  let el = $('#fvToast');
  if (!el) { el = document.createElement('div'); el.id = 'fvToast'; el.className = 'toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  el.innerHTML = `<span class="toast-i" aria-hidden="true">${ico || '★'}</span><span>${esc(t)}</span>`;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 4500);
}
VIEWS['crew:hoy'] = () => {
  const id = session.uid, I = FV.ind(id), c = FV.combined(id), d = doneToday(id), v = FV.live[id];
  const tasks = [['band', 'Brazalete puesto', null], ['mind', 'Chequeo de mente y estrés', 'mente'], ['food', 'Chequeo de nutrición', 'nutri'], ['reg', 'Confirmar glucosa y presión (llegan solas)', 'reg'], ['react', 'Test de reacción', 'reg']];
  const n = tasks.filter((t) => d[t[0]]).length;
  return hello(crew(id).name + ' · ' + crew(id).job, 'Ahora sí, vamos a registrar tu día.') +
  (protoFor(FV.protocols()).length ? protoPanel(0) : '') +
  `<div class="cols c-21">
    ${panel(1, 'Tu día', `<p class="big-k"><b>${n}</b><span class="label">de ${tasks.length} registros hechos</span></p><div class="prog"><i style="width:${n / tasks.length * 100}%"></i></div>
      <ol class="todo">${tasks.map((t, i) => `<li class="${d[t[0]] ? 'done' : ''}"><span class="label">${pad(i + 1)}</span><span class="t">${t[1]}</span>${d[t[0]] ? '<span class="label c-ok">Hecho</span>' : t[2] ? `<button type="button" class="btn-line label" data-tab="${t[2]}" data-focus="t${t[0]}">Hacer →</button>` : ''}</li>`).join('')}</ol>`)}
    ${panel(2, 'Cómo estás', `<p class="state-big" style="color:${FV.color(c.s)}">${FV.label(c.s)}</p><p class="note">${c.f.length ? 'Señales: ' + c.f.join(', ') + '.' : 'Sin señales cruzadas entre mente, nutrición y brazalete.'}</p>${c.s >= 2 ? '<button type="button" class="btn label" data-adv>Ver qué hacer →</button>' : ''}`)}
  </div>
  ${gamePanel(id, 3)}
  ${panel(4, `Tu brazalete <span class="livetag label">${['hr', 'spo2', 'temp'].some((k) => FV.isReal(id, k)) ? 'en vivo · dispositivo real' : 'en vivo · simulado'}</span>`, `<div class="ros">${['hr', 'spo2', 'temp', 'rr'].map((k) => readout(FV.isReal(id, k) ? {...I[k], src: 'Bluetooth'} : I[k], v.h[k])).join('')}${['sleep', 'act', 'dose', 'career'].map((k) => readout(I[k])).join('')}</div>
    <div class="row-btns"><button type="button" class="btn-line label" id="bandBtn" data-focus="band">Conectar brazalete real (Bluetooth)</button><span class="label dim" id="bandMsg">${esc(window.FVLive ? FVLive.bandStatus() : '')}</span></div>`)}
  ${fitPanel(id, 5, '¿Estoy apto hoy?')}
  ${sleepPanel(id, 6, false)}
  ${panel(7, 'Tu acompañante', `<p class="note">Todos los días, a la hora que elijas, el acompañante te abre la charla para completar lo que los sensores no miden. También te escribe si nota un cambio en tus signos.</p>
    <div class="inline"><label for="schedTime" class="label">Chequeo diario a las</label><input type="time" id="schedTime" value="${esc((S().sched || {})[id] || '08:00')}"><button type="button" class="btn-line label" id="schedSave">Guardar hora</button><button type="button" class="btn-line label" id="notifBtn">${'Notification' in window && Notification.permission === 'granted' ? 'Avisos activados ✓' : 'Activar avisos'}</button></div>
    <div class="row-btns"><span class="label dim">Probar:</span><button type="button" class="btn-line label" id="simHigh" data-focus="simh">Simular pulso alto</button><button type="button" class="btn-line label" id="simNow">Abrir el chequeo diario ahora</button></div>`)}`;
};

/* ---------- Sueño de anoche: fases (hipnograma) y tipo de sueño ---------- */
const SLC = {W: 'var(--warn)', R: '#b48cff', L: 'var(--earth)', D: '#2f6fd6'};
function hypnogram(N) {
  const W = 640, H = 170, L = 70, Rr = 10, T = 8, B = 24, pw = W - L - Rr, row = (H - T - B) / 4, n = N.hyp.length, bw = pw / n;
  const ROW = {W: 0, R: 1, L: 2, D: 3};
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Fases del sueño de anoche, de ${N.start / 60} h en adelante">`;
  ['W', 'R', 'L', 'D'].forEach((k, i) => { s += `<text x="${L - 8}" y="${T + row * i + row / 2 + 3}" text-anchor="end" font-family="IBM Plex Mono" font-size="9" letter-spacing="1" style="fill:var(--none)">${FV.STAGES[k].toUpperCase()}</text><line x1="${L}" x2="${W - Rr}" y1="${T + row * (i + 1)}" y2="${T + row * (i + 1)}" style="stroke:rgb(var(--fg-rgb) / .06)"/>`; });
  N.hyp.forEach((k, i) => { s += `<rect x="${L + i * bw}" y="${T + row * ROW[k] + 3}" width="${bw + 0.4}" height="${row - 6}" rx="1.5" style="fill:${SLC[k]}"/>`; });
  // línea que une las fases, como en un estudio de sueño
  let d = '';
  N.hyp.forEach((k, i) => { const y = T + row * ROW[k] + row / 2; d += (i ? `L${L + i * bw} ${y}` : `M${L} ${y}`) + `H${L + (i + 1) * bw}`; });
  s += `<path d="${d}" fill="none" style="stroke:rgb(var(--fg-rgb) / .35)" stroke-width="1"/>`;
  for (let m = 0; m <= n * N.E; m += 60) { const x = L + m / N.E * bw, h = Math.floor((N.start + m) / 60) % 24; s += `<text x="${x}" y="${H - 6}" text-anchor="middle" font-family="IBM Plex Mono" font-size="9" style="fill:var(--none)">${String(h).padStart(2, '0')}:00</text>`; }
  return s + '</svg>';
}
function sleepPanel(id, i, med) {
  const N = FV.sleepNight(id), pc = (x) => Math.round(x * 100) + ' %', hm = (m) => Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0');
  const tips = [];
  if (N.issues.includes('poco profundo')) tips.push('Poco sueño profundo: es el que repara el cuerpo. Ejercicio de día (no de noche), módulo fresco y oscuro.');
  if (N.issues.includes('poco REM')) tips.push('Poco REM: es el que ordena la memoria y el ánimo. Suele mejorar durmiendo más horas seguidas.');
  if (N.issues.includes('le cuesta dormirse')) tips.push('Tardó ' + N.lat + ' min en dormirse: luces bajas y pantallas apagadas una hora antes; respiración lenta.');
  if (N.issues.includes('interrumpido')) tips.push(N.wake + ' despertares: revisar ruido y luz del módulo de descanso.');
  if (N.issues.includes('corto')) tips.push('Durmió menos de 6 h: evitar tareas críticas y caminatas espaciales hasta recuperar.');
  const rows = [['D', 'Profundo', N.pct.D, '13–23 %'], ['R', 'REM', N.pct.R, '20–25 %'], ['L', 'Ligero', N.pct.L, '50–60 %']];
  return panel(i, `${med ? 'Sueño' : 'Tu sueño'} anoche · fases <span class="livetag label">brazalete · estimado</span>`,
    `<div class="slp-top"><div><p class="label dim">Tipo de sueño</p><p class="state-big" style="color:${FV.color(N.s)}">${N.tipo}</p></div>
      <dl class="facts"><div><dt class="label">Dormido</dt><dd>${hm(N.asleep)}</dd></div><div><dt class="label">Eficiencia</dt><dd style="color:${FV.color(N.eff >= 0.85 ? 0 : 1)}">${pc(N.eff)}</dd></div><div><dt class="label">Tardó en dormirse</dt><dd style="color:${FV.color(N.lat > 30 ? 1 : 0)}">${N.lat} min</dd></div><div><dt class="label">Despertares</dt><dd style="color:${FV.color(N.wake >= 3 ? 1 : 0)}">${N.wake}</dd></div></dl></div>
    ${hypnogram(N)}
    <ul class="slp-bars">${rows.map(([k, n, v, r]) => `<li><span class="label"><i style="background:${SLC[k]}"></i>${n}</span><span class="slp-bar"><i style="width:${Math.min(100, v * 100 / 0.6)}%;background:${SLC[k]}"></i></span><b>${pc(v)}</b><small class="dim">normal ${r}</small></li>`).join('')}</ul>
    ${tips.length ? `<ul class="why">${tips.map((t) => `<li>${t}</li>`).join('')}</ul>` : '<p class="note">Buen equilibrio entre sueño profundo y REM. Seguí con los mismos horarios.</p>'}
    <p class="note">El brazalete estima las fases con el movimiento y la variabilidad del pulso, en bloques de 5 minutos (como el Actiwatch que usa la NASA en la Estación Espacial). Es una estimación, no un estudio de sueño en laboratorio.</p>`);
}

const ans = {};
let savedMsg = '';

/* ---------- Lo que completan solos los sensores ---------- */
// Pregunta 1 (horas de sueño) y 3 (despertares) salen del brazalete; la 11 (corazón acelerado) del pulso en reposo.
function autoMind(id) {
  const v = FV.live[id];
  const sleep = v.sleep < 4 ? 0 : v.sleep < 6 ? 1 : v.sleep < 7 ? 2 : v.sleep <= 9 ? 3 : 4;
  const wake = v.wake <= 1 ? 0 : v.wake <= 3 ? 1 : 2;
  const heart = v.hr <= 90 ? 0 : v.hr <= 100 ? 1 : v.hr <= 110 ? 2 : 3;
  return {0: {v: sleep, src: 'Brazalete · ' + FV.f1(v.sleep) + ' h'}, 2: {v: wake, src: 'Brazalete · ' + v.wake + ' despertares'}, 10: {v: heart, src: 'Brazalete · pulso ' + Math.round(v.hr) + ' lpm'}};
}
const autoKeys = new Set();
function applyAuto() {
  const a = autoMind(session.uid);
  Object.entries(a).forEach(([i, x]) => { if (ans[i] === undefined || autoKeys.has(+i)) { ans[i] = x.v; autoKeys.add(+i); } });
}
// Glucómetro y tensiómetro conectados (simulado): mandan la lectura de la mañana.
function deviceReadings(id) {
  const r = FV.lastReg(id), sc = crew(id).sc, t = new Date(); t.setHours(7, 42, 0, 0);
  return {glu: r.glu ?? (sc === 'estres' ? 104 : 92), sys: r.sys ?? (sc === 'estres' ? 128 : 116), dia: r.dia ?? (sc === 'estres' ? 82 : 75), at: t};
}

/* ---------- Modo: charla con el acompañante o a mano ---------- */
let fillMode = 'chat';
const modeSwitch = (kind) => `<div class="mode" role="radiogroup" aria-label="Cómo completar"><button type="button" role="radio" aria-checked="${fillMode === 'chat'}" data-mode="chat">Charlar con el acompañante</button><button type="button" role="radio" aria-checked="${fillMode === 'manual'}" data-mode="manual">Completar a mano</button><span class="label dim">${kind}</span></div>`;

VIEWS['crew:mente'] = () => {
  applyAuto();
  const a = autoMind(session.uid);
  const groups = {sleep: 'Sueño', mood: 'Ánimo', anx: 'Ansiedad', str: 'Estrés y convivencia'};
  let q = '', n = 0;
  Object.keys(groups).forEach((g, gi) => {
    q += `<fieldset><legend><span class="label c-earth">${pad(gi + 1)}</span>${groups[g]}</legend>`;
    FV.Q.forEach((x, i) => { if (x.d !== g) return; n++; const au = a[i] && autoKeys.has(i); q += `<div class="q${au ? ' auto' : ''}"><p id="q${i}"><span class="label dim">${pad(n)}</span>${x.t}${au ? `<span class="src-tag label">${a[i].src}</span>` : ''}</p><div class="seg" role="group" aria-labelledby="q${i}">${x.o.map((o, j) => `<button type="button" data-q="${i}" data-v="${j}" aria-pressed="${ans[i] === j}">${o}</button>`).join('')}</div>${x.s ? `<div class="ends label"><span>1 · ${x.a}</span><span>5 · ${x.b}</span></div>` : ''}</div>`; });
    q += '</fieldset>';
  });
  const left = fillMode === 'chat' ? chatPanel('mente') :
    `<section class="panel hud">${ph(1, 'Preguntas')}${q}<div class="row-btns"><span class="label dim">Probar con:</span><button type="button" class="btn-line label" data-ex="ok">Bien</button><button type="button" class="btn-line label" data-ex="warn">Regular</button><button type="button" class="btn-line label" data-ex="bad">Muy mal</button><button type="button" class="btn-line label" id="mClear">Borrar</button></div></section>`;
  return hello('Mente y estrés', '¿Cómo dormiste y cómo te sentís?', 'El brazalete ya completó lo que mide solo. Lo demás lo podés charlar con el acompañante o completarlo a mano. El oficial médico ve tus respuestas; el comandante, solo el estado general.') +
  modeSwitch('3 de 14 completadas por el brazalete') +
  `<div class="cols c-mind">${left}<section class="panel hud stick" aria-live="polite">${ph(2, 'Tu chequeo')}<div id="mRes"></div></section></div>`;
};

/* ---------- El acompañante: pregunta, entiende la respuesta y llena el formulario ---------- */
const chats = {mente: [], nutri: []};
// Preguntas que la persona pidió dejar para después: se vuelven a hacer al final.
const skipped = {mente: new Set(), nutri: new Set()};
const nextQ = (kind) => {
  const sk = skipped[kind];
  const open = kind === 'mente' ? FV.Q.map((q, i) => i).filter((i) => ans[i] === undefined)
    : FV.NQ.map((q, i) => i).filter((i) => nq[FV.NQ[i][0]] === undefined).concat(water === null ? [4] : []);
  if (!open.length) return -1;
  const fresh = open.find((i) => !sk.has(i));
  if (fresh !== undefined) return fresh;
  sk.clear(); // ya pasamos por todas: volvemos a las salteadas
  return open[0];
};

/* ---------- Entender respuestas mal escritas o fuera de lugar ---------- */
// «un/una» no se convierten solos: «un poco» no es el número 1. «una hora» sí, más abajo.
const NUMW = {cero: 0, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, quince: 15, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60};
function normText(raw) {
  // En inglés, lo que dice la persona se pasa antes a palabras clave en español.
  let t = FVI18N.inEs(String(raw)).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  t = t.replace(/[😀😃😄😁😊🙂👍💪✅]/gu, ' bien ').replace(/[😢😞😔😭😩😫👎💔]/gu, ' mal ').replace(/[😐😶🤷]/gu, ' regular ');
  t = t.replace(/(.)\1{2,}/g, '$1').replace(/([aeiouns])\1\b/g, '$1'); // "muuuy" → "muy", "ningunaa" → "ninguna"
  const fix = [[/\bmui\b/g, 'muy'], [/\bvien\b|\bbn\b/g, 'bien'], [/\bq\b/g, 'que'], [/\b(xq|pq|porq)\b/g, 'porque'], [/\bmaso\b|\bmas o menos\b|\bmasomenos\b|\bmedio medio\b/g, 'regular'],
    [/\bora(s)?\b/g, 'hora$1'], [/\bhs?\b/g, 'horas'], [/\bmins?\b|\bminuts?\b/g, 'minutos'], [/\b(ns|nose|nc|ni idea|no me acuerdo|no recuerdo)\b/g, 'nolose'], [/\bno se\b/g, 'nolose'],
    [/\bnop+e?\b|\bnah\b|\bnoo+\b/g, 'no'], [/\bsii+\b|\bsep\b|\bsip\b|\bobvio\b/g, 'si'], [/\bre bien\b|\bsuper bien\b|\bgenial\b|\bexcelente\b|\bjoya\b/g, 'muy bien'], [/\bfatal\b|\bhorrible\b|\bpesimo\b|\bre mal\b/g, 'muy mal']];
  fix.forEach(([re, s]) => { t = t.replace(re, s); });
  t = t.replace(/\buna? hora\b(?! y media)/g, '1 hora').replace(/\buna vez\b/g, '1 vez').replace(/\buno\b/g, '1');
  t = t.replace(/\buna hora y media\b/g, '90 minutos').replace(/\bmedia hora\b/g, '30 minutos').replace(/\b(\d+) horas? y media\b/g, (m, n) => (+n + 0.5) + ' horas');
  t = t.replace(/\b([a-z]+)\b/g, (w) => (NUMW[w] !== undefined ? String(NUMW[w]) : w));
  return t.replace(/\s+/g, ' ').trim();
}
const YES = /^(si|dale|ok|okey|okay|claro|exacto|correcto|eso|asi es|afirmativo|de una)\b/;
const NO = /^(no|nada que ver|incorrecto|mal|para nada|negativo)\b/;
// Distancia entre palabras, para tolerar errores de tipeo ("ansiosso", "todass").
function lev(a, b) { const m = a.length, n = b.length, d = Array.from({length: m + 1}, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
function fuzzyOption(kind, i, t) {
  const opts = qInfo(kind, i).o.map((o) => normText(o.split(' · ').pop()));
  let best = -1, bd = 9;
  opts.forEach((o, j) => { if (o.length < 3) return; const words = t.split(' '); words.forEach((w) => { if (w.length < 3) return; const dd = lev(w, o.split(' ')[0]); if (dd < bd) { bd = dd; best = j; } }); });
  return bd <= 2 ? best : -1;
}
/** Revisa la respuesta: devuelve {v} si es clara, {confirm: v} si hay que confirmar, {ask: texto} si está fuera de rango, o null. */
function understand(kind, i, raw) {
  const t = normText(raw), n = (t.match(/-?\d+([.,]\d+)?/) || [])[0], num = n !== undefined ? parseFloat(n.replace(',', '.')) : null;
  if (/\bnolose\b/.test(t) || /\b(salta|saltea|despues|paso)\b/.test(t)) return {skip: true};
  const pos = byPosition(kind, i, t);
  if (pos !== null) return {v: pos};
  // En preguntas de opciones (no de cantidad), un número solo es el número de la opción: «dos» = la segunda.
  if (kind === 'nutri' && i < 4 && num !== null && /^\D*\d+\D*$/.test(t) && num >= 1 && num <= FV.NQ[i][2].length) return {v: num - 1};
  if (kind === 'mente') {
    const q = FV.Q[i];
    if (i === 0 && num !== null && !/minuto/.test(t) && (num < 0 || num > 16)) return {ask: `¿${num} horas? Me parece raro. Decime cuántas horas dormiste anoche, entre 0 y 16.`};
    if (i === 1 && num !== null && !/hora|minuto/.test(t) && num > 0 && num <= 5) return {confirm: 2, note: `¿${num} horas? Si fueron minutos, decime «${num} minutos».`, guess: 'Más de 40 min'};
    if (i === 2 && num !== null && num > 20) return {ask: `¿Te despertaste ${num} veces? Decime un número más chico, o elegí una opción.`};
    if (q.s) {
      const of10 = t.match(/(\d+)\s*(de|\/)\s*10/);
      if (of10) return {confirm: Math.max(0, Math.min(4, Math.round(+of10[1] / 2) - 1)), note: `Pasé tu ${of10[1]} de 10 a la escala del 1 al 5.`};
      if (num !== null && (num < 1 || num > 5)) return {ask: 'Usemos una escala del 1 al 5. ¿Qué número le pondrías?'};
      if (/ni bien ni mal|normal|regular/.test(t)) return {v: 2};
      if (/no (muy|tan) bien|no del todo/.test(t)) return {v: q.s === 'good' ? 1 : 3};
      if (/no (muy|tan) mal|no (estoy|me siento) mal/.test(t)) return {v: q.s === 'good' ? 3 : 1};
      // En preguntas de intensidad ("¿te sentiste tenso?"), «bien» o «mal» no son una cantidad: se confirma.
      if (q.s === 'bad' && /\bmuy mal\b/.test(t)) return {confirm: 4};
      if (q.s === 'bad' && /\bmal\b/.test(t)) return {confirm: 3};
      if (q.s === 'bad' && /\bbien\b/.test(t) && !/\bno\b/.test(t)) return {confirm: 0};
    }
  } else if (i === 4 && num !== null && num > 15) return {confirm: 8, note: `¿${num} vasos? Es mucho: lo anoto como 8 o más.`};
  const t2 = normText(raw);
  const v = parseAns(kind, i, t2);
  if (v !== null) return {v};
  const f = fuzzyOption(kind, i, t2);
  if (f >= 0) return {confirm: f};
  return null;
}
// Opciones dichas con su número, para responder «dos», «la segunda» o el texto.
const numbered = (opts) => ' Podés decir ' + opts.map((o, j) => `${j + 1}, ${o.toLowerCase()}`).join('; ') + '.';
function qInfo(kind, i) {
  if (kind === 'mente') {
    const q = FV.Q[i];
    if (q.s) return {t: q.t + ` Decime un número del 1 (${q.a.toLowerCase()}) al 5 (${q.b.toLowerCase()}).`, o: q.o.map((o, j) => o + (j === 0 ? ' · ' + q.a : j === 4 ? ' · ' + q.b : ''))};
    // Horas, minutos y despertares: el número es la cantidad; las opciones van como ayuda.
    return {t: q.t + numbered(q.o).replace('Podés decir', 'Podés decirme la cantidad o elegir'), o: q.o, qty: true};
  }
  if (i < 4) { const o = FV.NQ[i][2]; return {t: ['¿Cómo estuvo tu apetito hoy?', '¿Comiste tus comidas del día?', '¿Cuánto líquido tomaste hoy?', '¿Tuviste molestias digestivas, como náuseas, reflujo o hinchazón?'][i] + numbered(o), o: o.map((x, j) => (j + 1) + ' · ' + x)}; }
  return {t: '¿Cuántos vasos de agua tomaste hoy? Decime el número.', o: ['0', '1', '2', '3', '4', '5', '6', '7', '8+'], qty: true};
}
/* «la segunda», «opción 2», «la última»: elige por posición. */
const ORD = {primera: 1, primero: 1, segunda: 2, segundo: 2, tercera: 3, tercero: 3, cuarta: 4, cuarto: 4, quinta: 5, quinto: 5};
function byPosition(kind, i, t) {
  const len = qInfo(kind, i).o.length;
  let m = t.match(/\b(?:opcion|la|el|numero|nro)\s*(\d)\b/);
  let pos = m ? +m[1] : null;
  if (pos === null) { const w = t.match(/\b(primer[oa]|segund[oa]|tercer[oa]|cuart[oa]|quint[oa])\b/); if (w) pos = ORD[w[1]]; }
  if (pos === null && /\bultim[oa]\b/.test(t)) pos = len;
  return pos !== null && pos >= 1 && pos <= len ? pos - 1 : null;
}
// Ordenadas de lo más específico a lo más general ("muy mal" antes que "mal"); se recorren tal cual.
const WORDS5 = [[/\b(much[ií]simo|much[ií]simas?|totalmente|todo el tiempo|siempre|un mont[oó]n)\b/, 4], [/\b(muy poco|casi nada|poquito|un poco|poco)\b/, 1], [/\b(bastante|mucho|muchas?|seguido)\b/, 3], [/\b(algo|regular|m[aá]s o menos|a veces|medio)\b/, 2], [/\b(nada|nunca|ning[uú]n[ao]?|para nada|no)\b/, 0]];
const GOOD5 = [[/\b(muy bien|genial|excelente|totalmente|todo el tiempo|siempre|much[ií]simo)\b/, 4], [/\b(p[eé]sim[oa]|horrible|muy mal|fatal)\b/, 0], [/\b(bien|bastante|mucho)\b/, 3], [/\b(mal|poco)\b/, 1], [/\b(regular|m[aá]s o menos|normal)\b/, 2], [/\b(nada|ning[uú]n[ao]?)\b/, 0]];
function parseAns(kind, i, raw) {
  const t = raw.toLowerCase().trim(), num = (t.match(/\d+([.,]\d+)?/) || [])[0], n = num ? parseFloat(num.replace(',', '.')) : null;
  const {o} = qInfo(kind, i);
  const exact = o.findIndex((x) => t === x.toLowerCase() || t === x.split(' · ')[0].toLowerCase());
  if (exact >= 0) return exact;
  if (kind === 'mente') {
    const q = FV.Q[i];
    if (i === 0 && n !== null) return n < 4 ? 0 : n < 6 ? 1 : n < 7 ? 2 : n <= 9 ? 3 : 4;
    if (i === 1) {
      if (n !== null) return /hora/.test(t) ? (n >= 1 ? 2 : 1) : n < 20 ? 0 : n <= 40 ? 1 : 2;
      if (/media hora|un rato|bastante/.test(t)) return 1;
      if (/hora|much|tard|no pod|cost/.test(t)) return 2;
      if (/r[aá]pid|enseguida|al toque|nada|poco|apenas/.test(t)) return 0;
    }
    if (i === 0 && /poco|casi nada|mal/.test(t)) return 1;
    if (i === 2 && n !== null) return n <= 1 ? 0 : n <= 3 ? 1 : 2;
    if (q.s) {
      if (n !== null && n >= 1 && n <= 5) return Math.round(n) - 1;
      const L = q.s === 'good' ? GOOD5 : WORDS5;
      for (const [re, v] of L) if (re.test(t)) return v;
    }
    const part = o.findIndex((x) => t.includes(x.toLowerCase()));
    if (part >= 0) return part;
    // Preguntas de 3 opciones: poco / algo / mucho.
    if (o.length === 3) { if (/\b(nada|ning|no|poc[oa]s?|bien)\b/.test(t)) return 0; if (/\b(algun|algo|regular|a veces)\b/.test(t)) return 1; if (/\b(much|bastante|muy|siempre)\b/.test(t)) return 2; }
    return null;
  }
  if (i === 4) return n !== null ? Math.min(8, Math.max(0, Math.round(n))) : /\bning|nada|cero\b/.test(t) ? 0 : null;
  const key = FV.NQ[i][0];
  const M = {
    ap: [[/\b(nada|muy bajo|sin hambre|no tengo hambre|ning)/, 2], [/\b(poco|menos|bajo|disminu)/, 1], [/\b(normal|bien|s[ií]|buen)/, 0]],
    me: [[/\b(ninguna|casi ninguna|no|nada)\b/, 2], [/\b(algunas|algo|la mitad|pocas)\b/, 1], [/\b(todas|s[ií]|todo)\b/, 0]],
    fl: [[/\b(muy poc|nada|casi nada)/, 2], [/\b(poc)/, 1], [/\b(suficiente|bastante|mucho|bien|normal)/, 0]],
    gi: [[/\b(marcad|mucho|fuerte|horrible|vomit|vómit)/, 2], [/\b(leve|poco|algo|un poco)/, 1], [/\b(ninguna|nada|no|bien)\b/, 0]],
  }[key];
  for (const [re, v] of M) if (re.test(t)) return v;
  return null;
}
const ACK = ['Anotado.', 'Perfecto, gracias.', 'Listo.', 'Entendido.', 'Gracias por contarme.'];
/* Guarda el chequeo de mente (lo usan el botón «Guardar» y el asistente al terminar la charla). */
function saveMind() {
  const r = FV.calc(ans); if (r.s === null) return null;
  S().checks.push({id: FV.nid(), uid: session.uid, ts: Date.now(), idx: r.idx ?? 100, s: r.s, ds: Object.fromEntries(Object.entries(r.ds).map(([k, v]) => [k, Math.round(v)])), ans: FV.Q.map((q, i) => ans[i])});
  FV.save(); savedMsg = 'Guardado (' + FV.fmt(Date.now()) + '). Ya lo ve el oficial médico.';
  chats.mente = []; Object.keys(ans).forEach((k) => delete ans[k]); autoKeys.clear();
  renderAdvBtn();
  return r;
}
/* Chequeo charlado dentro del asistente: las preguntas de mente y estrés se completan solas
   con lo que la persona dice, y al terminar se guarda solo. */
let advCheck = false;
function startCheckInAdv(byUser) {
  if (!session || session.role !== 'crew') return;
  advCheck = true; advTab = 'chat'; offerCheck = false;
  if (!chats.mente.length) chatStart('mente');
  if ($('#adv').hidden) openAdv(byUser, true); else renderAdv();
  // Si lo pidió la persona, queda escuchando para que conteste en voz alta.
  if (byUser && window.FVLive && !FVLive.talking('advQ')) FVLive.toggleTalk('advQ', '');
  if (window.FVLive) FVLive.speakNew('mente', chats.mente);
  renderAdv();
}
let offerCheck = false;
function botAsk(kind) {
  const i = nextQ(kind), log = chats[kind];
  if (i < 0) {
    if (kind === 'mente' && advCheck) {
      const r = saveMind(); advCheck = false;
      const st = r ? ['estás bien', 'conviene vigilar un poco', 'hay señales de alerta: el oficial médico ya lo puede ver', 'es importante que hables ya con el oficial médico'][r.s] : '';
      advLog.unshift({q: null, t: '', a: `Listo, completé y guardé tu chequeo de hoy. Según lo que me contaste, ${st}. Gracias por tomarte el rato.`, raw: true, ts: Date.now()});
      if (window.FVLive) FVLive.speak(advLog[0].a);
      if (r && r.s >= 3) crewAlert('su chequeo de salud mental salió en emergencia');
      return;
    }
    log.push({who: 'bot', t: kind === 'mente' ? 'Listo, ya completé todo tu chequeo. Revisalo a la derecha y, si está bien, tocá «Guardar chequeo». Si querés seguir charlando, acá estoy.' : 'Listo, completé tu chequeo de nutrición. Tocá «Guardar» cuando quieras.'}); return;
  }
  const {t} = qInfo(kind, i);
  log.push({who: 'bot', t, q: i});
}
function chatStart(kind, intro) {
  const log = chats[kind]; if (log.length) return;
  if (kind === 'mente') applyAuto(); // primero lo que ya midió el brazalete: esas no se preguntan
  if (intro) { log.push({who: 'bot', t: intro}); botAsk(kind); return; }
  const v = FV.live[session.uid], name = crew(session.uid).name;
  if (kind === 'mente') log.push({who: 'bot', t: `Hola, ${name}. Soy tu acompañante. Del brazalete ya tengo que dormiste ${FV.f1(v.sleep)} h, que te despertaste ${v.wake} ${v.wake === 1 ? 'vez' : 'veces'} y que tu pulso en reposo está en ${Math.round(v.hr)} lpm, así que esas no te las pregunto. Te hago las demás, cortitas. Podés contestar con tus palabras o tocar una opción.`});
  else log.push({who: 'bot', t: `Hola, ${name}. Charlemos un minuto sobre lo que comiste hoy. Contestá como te salga.`});
  botAsk(kind);
}
const pendingConfirm = {mente: null, nutri: null};
function applyAnswer(kind, i, v) {
  if (kind === 'mente') { ans[i] = v; autoKeys.delete(i); } else if (i < 4) nq[FV.NQ[i][0]] = v; else water = v;
  skipped[kind].delete(i);
}
function chatSay(kind, text) {
  const log = chats[kind];
  let i = nextQ(kind);
  log.push({who: 'me', t: text});
  const t = normText(text);
  if (!/[a-z0-9]/.test(t)) { log.push({who: 'bot', t: 'No llegué a entender. ¿Me lo escribís con palabras o tocás una opción?'}); return; }
  // ¿Estaba esperando una confirmación?
  const pc = pendingConfirm[kind];
  if (pc) {
    pendingConfirm[kind] = null;
    if (YES.test(t)) { applyAnswer(kind, pc.q, pc.v); log.push({who: 'bot', t: 'Perfecto, anotado.', fill: qInfo(kind, pc.q).o[pc.v]}); botAsk(kind); return; }
    if (NO.test(t) && t.split(' ').length <= 3) { log.push({who: 'bot', t: 'Dale, sin problema. Elegí la opción que más se acerque, o contámelo de otra forma.'}); log.push({who: 'bot', t: qInfo(kind, pc.q).t, q: pc.q}); return; }
    i = pc.q; // respondió otra cosa: la tomo como respuesta a la misma pregunta
  }
  if (/guard/i.test(text) && i < 0) { log.push({who: 'bot', t: 'Tocá el botón «Guardar» del panel de la derecha y queda registrado.'}); return; }
  if (i >= 0) {
    const u = understand(kind, i, text);
    if (u && u.skip) { skipped[kind].add(i); log.push({who: 'bot', t: 'No pasa nada, la dejamos para el final.'}); botAsk(kind); return; }
    if (u && u.ask) { log.push({who: 'bot', t: u.ask, q: i}); return; }
    if (u && u.confirm !== undefined) {
      pendingConfirm[kind] = {q: i, v: u.confirm};
      log.push({who: 'bot', t: (u.note ? u.note + ' ' : '') + `¿Quisiste decir «${u.guess || qInfo(kind, i).o[u.confirm]}»? Respondé sí o no.`});
      return;
    }
    const v = u ? u.v : null;
    if (v !== null) {
      if (kind === 'mente') { ans[i] = v; autoKeys.delete(i); } else if (i < 4) nq[FV.NQ[i][0]] = v; else water = v;
      const heavy = kind === 'mente' ? FV.Q[i].lv[v] === 2 : (i < 4 ? v === 2 : v < 3);
      log.push({who: 'bot', t: heavy ? 'Gracias por contármelo, no es poca cosa. Lo dejo anotado para que el oficial médico lo tenga en cuenta.' : ACK[(log.length + i) % ACK.length], fill: qInfo(kind, i).o[v]});
      botAsk(kind);
      return;
    }
  }
  const tp = FV.topicAnswer(text);
  if (tp) { log.push({who: 'bot', t: tp.a + (i >= 0 ? ' Cuando quieras seguimos con el chequeo.' : '')}); if (i >= 0) botAsk(kind); return; }
  log.push({who: 'bot', t: i >= 0 ? 'No te entendí del todo. Probá con otras palabras o tocá una de las opciones.' : 'Te escucho. Si es algo de salud que te preocupa, contámelo con más detalle o tocá «Pedir ayuda».'});
}
/* ---------- Con IA (Gemini): charla libre que igual llena el formulario ---------- */
function pendingFor(kind) {
  if (kind === 'mente') return FV.Q.map((q, i) => (ans[i] === undefined ? {q: i, pregunta: q.t, opciones: q.o.map((o, j) => j + ': ' + o + (q.s ? (j === 0 ? ' (' + q.a + ')' : j === 4 ? ' (' + q.b + ')' : '') : ''))} : null)).filter(Boolean);
  const out = FV.NQ.map((q, i) => (nq[q[0]] === undefined ? {q: i, pregunta: qInfo('nutri', i).t, opciones: q[2].map((o, j) => j + ': ' + o)} : null)).filter(Boolean);
  if (water === null) out.push({q: 4, pregunta: '¿Cuántos vasos de agua tomaste hoy?', opciones: ['0 a 8: el número de vasos']});
  return out;
}
async function aiChatSay(kind, text) {
  const log = chats[kind], uid = session.uid, v = FV.live[uid];
  log.push({who: 'me', t: text});
  const wait = {who: 'bot', t: 'Escribiendo…', wait: true};
  log.push(wait); rerenderChat(kind);
  try {
    const pend = pendingFor(kind);
    const sys = `Sos el acompañante de salud de FAVALORO, una app para astronautas. Hablás con ${crew(uid).name} (${crew(uid).job}), que está en ${FV.envOf().n}. Español rioplatense con voseo, cálido y breve: máximo 60 palabras por mensaje, sin listas.
Tu tarea: completar charlando el chequeo de ${kind === 'mente' ? 'salud mental y estrés' : 'nutrición'}. Hacé UNA pregunta por mensaje, con tus palabras, sin interrogar. Si la persona quiere charlar de otra cosa, acompañala y después retomá.
Datos que ya midió el brazalete (no los preguntes): sueño ${FV.f1(v.sleep)} h, ${v.wake} despertares, pulso ${Math.round(v.hr)} lpm, oxígeno ${Math.round(v.spo2)} %, temperatura ${FV.f1(v.temp)} °C.
Preguntas pendientes, con el número de cada opción: ${JSON.stringify(pend)}
Cuando lo que dijo la persona permita elegir una opción con seguridad, agregala en "fills" (q = número de pregunta, v = número de opción). Si no es claro, repreguntá. ${pend.length ? '' : 'Ya no quedan preguntas: decile que revise el resumen y toque «Guardar».'}
Si aparece riesgo (ideas de hacerse daño, dolor de pecho, falta de aire, desmayo), respondé con cuidado, pedile que avise ya al oficial médico o toque «Pedir ayuda», y poné "alert": true.
No diagnostiques ni indiques medicación. No sos una persona: sos una IA y no reemplazás al médico.${AI_LANG()}
Respondé SOLO con JSON: {"reply": "texto", "fills": [{"q": 0, "v": 0}], "alert": false}`;
    // Si la IA tarda más de 10 s, sigue la charla con las reglas para no dejar a la persona esperando.
    const r = await Promise.race([FVAI.ask(sys, log.filter((m) => !m.wait), true), new Promise((_, rej) => setTimeout(() => rej(new Error('lenta')), 10000))]);
    const valid = new Set(pend.map((p) => p.q)), names = [];
    (Array.isArray(r.fills) ? r.fills : []).forEach((f) => {
      const q = +f.q, val = +f.v;
      if (!valid.has(q) || !Number.isInteger(val) || val < 0) return;
      if (kind === 'mente') { if (val >= FV.Q[q].o.length) return; ans[q] = val; autoKeys.delete(q); names.push(FV.Q[q].o[val]); }
      else if (q < 4) { if (val >= FV.NQ[q][2].length) return; nq[FV.NQ[q][0]] = val; names.push(FV.NQ[q][2][val]); }
      else { water = Math.min(8, val); names.push(water + ' vasos'); }
    });
    log.splice(log.indexOf(wait), 1);
    log.push({who: 'bot', t: String(r.reply || 'Te escucho.'), fill: names.join(' · '), ai: true});
    if (r.alert) log.push({who: 'bot', t: 'Si lo necesitás ahora, tocá «Pedir ayuda» arriba: avisa al oficial médico y al Comandante al instante.'});
  } catch (e) {
    // Sin IA: las reglas siguen la charla.
    log.splice(log.indexOf(wait), 1); log.pop();
    chatSay(kind, text);
  }
  rerenderChat(kind);
}
const sayAny = (kind, text) => (window.FVAI && FVAI.enabled() ? aiChatSay(kind, text) : (chatSay(kind, text), rerenderChat(kind)));

/* Burbujas de la charla, con el mismo diseño que el panel del asistente. */
function chatBubbles(kind) {
  return chats[kind].map((m) => (m.who === 'me' ? `<li class="me">${esc(m.t)}</li>`
    : `<li class="bot"><span class="who">Asistente${m.ai ? ' · IA' : ''}</span>${m.wait ? '<span class="adv-typing" aria-label="Escribiendo"><i></i><i></i><i></i></span>' : esc(m.t)}${m.fill ? `<div class="acts"><span class="ok">✓ Anotado: ${esc(m.fill)}</span></div>` : ''}</li>`)).join('');
}
// Opciones de la pregunta actual, para tocar o decir en voz alta.
function chatOpts(kind) {
  const i = nextQ(kind); if (i < 0) return '';
  return `<div class="adv-optrow">${qInfo(kind, i).o.map((o) => `<button type="button" data-say="${esc(o.split(' · ')[0])}" data-kind="${kind}">${esc(o)}</button>`).join('')}<button type="button" class="skip" data-say="después" data-kind="${kind}">Saltear</button></div>`;
}
const chatDone = (kind) => (kind === 'mente' ? [Object.keys(ans).length, FV.Q.length] : [FV.NQ.filter((q) => nq[q[0]] !== undefined).length + (water !== null ? 1 : 0), 5]);
function chatPanel(kind) {
  chatStart(kind);
  const [done, total] = chatDone(kind), on = !!(window.FVLive && FVLive.talking('chatQ'));
  return `<section class="panel hud chat">${ph(1, 'Asistente', `<span class="label dim">${done} de ${total} completadas</span>`)}
    <ol class="adv-conv chat-scroll" id="chatLog" aria-live="polite">${chatBubbles(kind)}</ol>
    ${chatOpts(kind)}
    <form class="chat-in adv-row" data-chat="${kind}"><button type="button" class="adv-talk" data-talk="chatQ" aria-pressed="${on}"><span class="adv-wave" aria-hidden="true"><i></i><i></i><i></i></span><span class="lbl">${on ? 'Pausar' : 'Hablar'}</span></button><label class="sr" for="chatQ">Tu respuesta</label><input type="text" id="chatQ" maxlength="300" autocomplete="off" placeholder="O escribí acá…"><button type="submit" class="adv-send label">Enviar</button></form>
    <p class="adv-how">${window.FVAI && FVAI.enabled() ? 'IA conectada · no reemplaza al oficial médico.' : 'Entiende frases comunes, aunque tengan errores.'} <button type="button" class="link-btn label" data-voice aria-pressed="${!!(window.FVLive && FVLive.voiceOn())}">${window.FVLive && FVLive.voiceOn() ? 'Voz: sí' : 'Voz: no'}</button> <button type="button" class="link-btn label" data-aiset>${window.FVAI && FVAI.enabled() ? 'Ajustes de IA' : 'Conectar IA gratis'}</button></p>
  </section>`;
}
function rerenderChat(kind) {
  const y = window.scrollY, inAdv = !$('#adv').hidden && advCheck;
  render();
  if (!$('#adv').hidden) renderAdv();
  if (window.FVLive) FVLive.speakNew(kind, chats[kind]);
  const lg = $('#chatLog'); if (lg) lg.scrollTop = lg.scrollHeight;
  const inp = inAdv ? null : $('#chatQ'); if (inp) inp.focus({preventScroll: true});
  window.scrollTo(0, y);
}
function mindEval() {
  const r = FV.calc(ans), el = $('#mRes'); if (!el) return;
  $$('[data-q]').forEach((b) => b.setAttribute('aria-pressed', String(ans[b.dataset.q] === +b.dataset.v)));
  const miss = FV.Q.filter((q, i) => ans[i] === undefined).length;
  el.innerHTML = meter(r.s === 3 && r.idx === null ? 100 : r.idx, r.s) +
    `<p class="state-big" style="color:${FV.color(r.s)}">${r.s === null ? 'Sin respuestas' : ['Estás bien', 'A vigilar', 'Alerta', 'Emergencia'][r.s]}</p>
    ${r.s === 3 ? '<div class="urgent" role="alert"><p class="label">Qué hacer ahora</p><ol><li>Avisá ya al oficial médico y al Comandante, o tocá «Pedir ayuda».</li><li>No te quedes solo: pedile a un compañero que esté con vos.</li><li>Dejá las tareas críticas hasta que te evalúen.</li></ol></div>' : ''}
    ${domains(r.ds)}${r.why.length ? '<ul class="why">' + r.why.map((x) => `<li>${x}</li>`).join('') + '</ul>' : ''}
    <button type="button" class="btn label wide" id="mSave" ${miss ? 'disabled' : ''}>${miss ? `Faltan ${miss} respuesta${miss > 1 ? 's' : ''}` : 'Guardar chequeo →'}</button><p class="note">${savedMsg}</p>`;
}

const nq = {}; let water = null, massIn = '', nMsg = '';
VIEWS['crew:nutri'] = () => {
  const id = session.uid, n = FV.nsum(id), m = n.m;
  const ready = FV.NQ.every((q) => nq[q[0]] !== undefined) && water !== null;
  const manual = `<section class="panel hud">${ph(1, 'Chequeo rápido')}
      ${FV.NQ.map((q) => `<div class="q"><p>${q[1]}</p><div class="seg">${q[2].map((o, j) => `<button type="button" data-nq="${q[0]}" data-v="${j}" aria-pressed="${nq[q[0]] === j}">${o}</button>`).join('')}</div></div>`).join('')}
      <div class="q"><p>Vasos de agua hoy <span class="label dim">meta 6</span></p><div class="seg">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((v) => `<button type="button" data-water="${v}" aria-pressed="${water === v}">${v === 8 ? '8+' : v}</button>`).join('')}</div></div>
    </section>`;
  const summary = `<section class="panel hud">${ph(2, 'Lo que vas a guardar')}<dl class="facts">${FV.NQ.map((q) => `<div><dt class="label">${q[1].replace(/[¿?]/g, '')}</dt><dd>${nq[q[0]] === undefined ? '—' : q[2][nq[q[0]]]}</dd></div>`).join('')}<div><dt class="label">Agua</dt><dd>${water === null ? '—' : water + ' vasos'}</dd></div></dl>
      <button type="button" class="btn label wide" id="nSave" ${ready ? '' : 'disabled'}>${ready ? 'Guardar chequeo →' : 'Faltan respuestas'}</button><p class="note">${nMsg}</p></section>`;
  return hello('Nutrición', '¿Qué comiste hoy?', 'Comidas y agua todavía no las mide un sensor: charlalas con el acompañante o completalas a mano.') + modeSwitch('La masa corporal llega de la balanza') + `<div class="cols c-2">
    <div class="stack">${fillMode === 'chat' ? chatPanel('nutri') : manual}${summary}</div>
    <div class="stack">
      ${panel(2, 'Tu semáforo', st(n.s) + (n.sig.length ? '<ul class="why">' + n.sig.map((x) => `<li>${x.x}</li>`).join('') + '</ul>' : '<p class="note">Sin señales de alerta.</p>') + '<p class="label sub">Ingesta · 14 días</p>' + strip14(id))}
      ${panel(3, 'Masa corporal', `<p class="note">${m.length ? 'Base ' + FV.f1(m[0].kg) + ' kg · última ' + FV.f1(m[m.length - 1].kg) + ' kg' + (n.pct !== null ? ' · cambio ' + (n.pct > 0 ? '+' : '') + FV.f1(n.pct) + ' %' : '') : 'Tu primera medición queda como valor base.'}</p><div class="inline"><input type="number" id="nMass" step="0.1" min="20" max="300" placeholder="kg" value="${esc(massIn)}" aria-label="Masa corporal en kilos"><button type="button" class="btn-line label" id="nMassSave">Guardar masa</button></div>`)}
    </div></div>`;
};

let rx = {state: 'idle', t0: 0, tries: [], timer: null}, regMsg = '';
const regDraft = {mood: null};
/* Ánimo de hoy: sale solo del chequeo de mente (charlado con el asistente). 1 = muy mal, 5 = muy bien. */
function moodToday(id) {
  const c = FV.checksOf(id).filter((x) => FV.dayOf(x.ts) === today() && !x.demo).pop();
  return c && c.ds && c.ds.mood !== undefined ? Math.max(1, Math.min(5, 5 - Math.round(c.ds.mood / 25))) : null;
}
// Lectura real por Bluetooth de hoy (si llegó del tensiómetro o del brazalete).
const realReg = (id, k) => FV.regsOf(id).filter((r) => FV.dayOf(r.ts) === today() && !r.demo && r[k] != null && r.src === 'ble').pop();
VIEWS['crew:reg'] = () => {
  const id = session.uid, r = deviceReadings(id), hhmm = pad(r.at.getHours()) + ':' + pad(r.at.getMinutes());
  const bp = realReg(id, 'sys'), mood = regDraft.mood ?? moodToday(id), moodAuto = regDraft.mood === null && mood !== null;
  return hello('Registros', 'Lo que llega de los dispositivos.', 'Todo se completa solo: el glucómetro y el tensiómetro mandan la lectura por Bluetooth, y el ánimo sale de tu charla con el asistente. Vos solo revisás y confirmás; si algo no llegó, lo cargás a mano.') + `<div class="cols c-2">
    <section class="panel hud">${ph(1, 'Lecturas de hoy')}
      <div class="field"><label for="rGlu" class="label">Glucosa · mg/dL <span class="src-tag">Glucómetro · ${hhmm} · simulado</span></label><input type="number" id="rGlu" min="20" max="600" value="${r.glu}"></div>
      <div class="field"><label for="rSys" class="label">Presión · mmHg <span class="src-tag">${bp ? 'Tensiómetro Bluetooth · ' + new Date(bp.ts).toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit'}) + ' · real' : 'Tensiómetro · ' + hhmm + ' · simulado'}</span></label><div class="inline"><input type="number" id="rSys" min="60" max="250" value="${bp ? bp.sys : r.sys}" aria-label="Sistólica"><span class="dim">/</span><input type="number" id="rDia" min="30" max="160" value="${bp ? bp.dia : r.dia}" aria-label="Diastólica"></div></div>
      <div class="field"><span class="label">Ánimo de hoy · 1 a 5 ${moodAuto ? '<span class="src-tag">De tu charla con el asistente</span>' : ''}</span><div class="seg">${[1, 2, 3, 4, 5].map((v) => `<button type="button" data-mood="${v}" aria-pressed="${mood === v}">${v}</button>`).join('')}</div>${mood === null ? '<p class="note">Se completa solo cuando hacés tu chequeo charlando con el asistente. <button type="button" class="link-btn label" data-checkadv>Hacerlo ahora</button></p>' : ''}</div>
      <div class="row-btns"><button type="button" class="btn-line label" id="bandBtn" data-focus="band">Conectar tensiómetro o brazalete real (Bluetooth)</button><span class="label dim" id="bandMsg">${esc(window.FVLive ? FVLive.bandStatus() : '')}</span></div>
      <button type="button" class="btn label wide" id="rSave">Confirmar y guardar →</button><p class="note">${regMsg}</p>
    </section>
    <section class="panel hud">${ph(2, 'Test de reacción')}<p class="note">Tocá el recuadro, esperá la señal y tocalo lo más rápido que puedas. Se promedian 3 intentos.</p>
      <div class="react ${rx.state === 'wait' ? 'wait' : rx.state === 'go' ? 'go' : ''}" id="rx" role="button" tabindex="0" data-focus="rx"><span class="label">${rx.state === 'wait' ? 'Esperá…' : rx.state === 'go' ? 'Ahora' : rx.tries.length >= 3 ? 'Promedio' : rx.tries.length ? 'Intento ' + (rx.tries.length + 1) + ' de 3' : 'Tocá para empezar'}</span>${rx.tries.length >= 3 && rx.state !== 'wait' && rx.state !== 'go' ? `<b>${Math.round(rx.tries.reduce((a, b) => a + b, 0) / 3)} ms</b>` : ''}</div>
      <p class="tries label">${rx.tries.map((m, i) => `#${i + 1} · ${m} ms`).join('&nbsp;&nbsp;&nbsp;')}</p>
      <p class="note">Menos de 350 ms: en rango. Más de 500 ms: alerta.</p>
    </section></div>`;
};
/* ======================================================================
   PREVENCIÓN · apto para la tarea, línea base, alerta temprana, tests,
   ruido, botiquín y consulta con la Tierra
   ====================================================================== */
const TASKS = {eva: 'Caminata espacial (EVA)', crit: 'Tarea crítica (maniobras, robótica)'};
function fitCard(id, task) {
  const F = FV.fitness(id, task), c = FV.color(F.s);
  return `<div class="fit" style="--c:${c}"><div class="fit-h"><span class="label">${TASKS[task]}</span><b>${F.label}</b></div>${F.why.length ? `<ul>${F.why.map((w) => `<li style="--c:${FV.color(w.s)}">${esc(w.t)}</li>`).join('')}</ul>` : '<p class="note">Sin señales en contra.</p>'}</div>`;
}
const fitPanel = (id, i, title) => panel(i, title || '¿Apto para la tarea?', `<div class="fits">${fitCard(id, 'eva')}${fitCard(id, 'crit')}</div><p class="note">Cruza sueño, reacción, memoria y atención, signos vitales, su propio normal, salud mental, vista, dosis de radiación y tormenta solar. Decide el Comandante con el oficial médico.</p>`);
function ewsPanel(id, i) {
  const E = FV.news2(id), B = FV.baseline(id), names = {hr: ['Pulso', 'lpm', 0], spo2: ['Oxígeno', '%', 0], temp: ['Temperatura', '°C', 1], rr: ['Respiración', '/min', 0]};
  const n = (v, d) => (d ? FV.f1(v) : Math.round(v));
  return panel(i, 'Alerta temprana y su propio normal', `<div class="ews"><div class="ews-n" style="--c:${FV.color(Math.min(E.s, 3))}"><b>${E.total}</b><span class="label">${E.txt}</span></div>
    <ul class="ews-p">${E.pts.map(([k, p]) => `<li><span>${k}</span><i class="ews-dots">${[1, 2, 3].map((x) => `<em class="${p >= x ? 'on' : ''}"></em>`).join('')}</i></li>`).join('')}</ul></div>
    <div class="wx"><table><thead><tr><th>Signo</th><th>Ahora</th><th>Su normal</th><th>Desvío</th></tr></thead><tbody>${Object.entries(B).map(([k, x]) => `<tr><td>${names[k][0]}</td><td>${n(x.val, names[k][2])} ${names[k][1]}</td><td>${n(x.m, names[k][2])} ± ${n(2 * x.sd, 1)}</td><td>${st(x.s, x.s ? (x.z > 0 ? 'más alto' : 'más bajo') + ' que su normal' : 'en su normal')}</td></tr>`).join('')}</tbody></table></div>
    <p class="note">Puntaje: adaptación del NEWS2 (Royal College of Physicians), 0 a 4 bajo, 5 a 6 medio, 7 o más alto. «Su normal» se aprendió de sus primeros días de misión: avisa aunque el valor esté dentro del rango general.</p>`);
}
VIEWS['cmd:apto'] = () => hello('¿Apto para la tarea?', 'Antes de una caminata espacial o una tarea crítica.', 'La app cruza los datos de cada tripulante y dice si está apto hoy, apto con cuidado o no apto, y por qué.') +
  `<div class="fit-crew">${FV.CREW.map((m) => `<section class="panel hud"><header class="ph"><span class="label">${m.id.toUpperCase()}</span><h3>${m.name}</h3><span class="label dim">${m.job}</span></header><div class="fits">${fitCard(m.id, 'eva')}${fitCard(m.id, 'crit')}</div></section>`).join('')}</div>` +
  panel(9, 'Para asignar hoy', (() => { const ok = FV.CREW.filter((m) => FV.fitness(m.id, 'eva').s === 0); return `<p>${ok.length ? 'Aptos para EVA: <b>' + ok.map((m) => m.name).join(', ') + '</b>.' : '<b>Nadie está apto para EVA hoy.</b> Postergar la caminata o reevaluar después del descanso.'}</p><p class="note">Una EVA necesita al menos dos tripulantes aptos y uno dentro de la nave de apoyo.</p>`; })());

/* ---------- Tests: vista (SANS), memoria, atención y audición ---------- */
const vt = {L: null, R: null, blur: null, ache: null, msg: ''};
const mem = {phase: 'idle', len: 4, seq: '', best: 0, fails: 0, msg: ''};
const stp = {phase: 'idle', i: 0, ok: 0, ms: [], t0: 0, cur: null, msg: ''};
const aud = {phase: 'idle', i: 0, lvl: 0, res: {}, msg: ''};
const COLORS = [['ROJO', '#ff7f6b'], ['VERDE', '#8cc56b'], ['AZUL', '#6fb6ff'], ['AMARILLO', '#f0d25a']];
const AUD_F = [1000, 4000, 8000], AUD_G = [0.006, 0.03];
let tctx = null;
function tone(f, g) {
  try {
    tctx = tctx || new (window.AudioContext || window.webkitAudioContext)(); if (tctx.state === 'suspended') tctx.resume();
    const o = tctx.createOscillator(), a = tctx.createGain(), t = tctx.currentTime + 0.05;
    o.frequency.value = f; a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.05); a.gain.setValueAtTime(g, t + 0.9); a.gain.exponentialRampToValueAtTime(0.0001, t + 1);
    o.connect(a).connect(tctx.destination); o.start(t); o.stop(t + 1.05);
  } catch (e) { /* sin audio */ }
}
function amsler() {
  let s = '<svg class="amsler" viewBox="0 0 200 200" role="img" aria-label="Rejilla de Amsler: mirá el punto del centro">';
  for (let i = 0; i <= 20; i++) { const p = i * 10; s += `<line x1="${p}" y1="0" x2="${p}" y2="200"/><line x1="0" y1="${p}" x2="200" y2="${p}"/>`; }
  return s + '<circle cx="100" cy="100" r="3.5"/></svg>';
}
const triad = (key, opts) => `<div class="seg">${opts.map(([v, t]) => `<button type="button" data-vt="${key}" data-v="${v}" aria-pressed="${vt[key] === v}">${t}</button>`).join('')}</div>`;
function noiseChart(N) {
  const W = 640, H = 150, L = 34, T = 8, B = 22, pw = W - L - 8, ph2 = H - T - B, bw = pw / 24, Y = (d) => T + ph2 * (1 - (d - 40) / 50);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ruido por hora del día">`;
  [50, 67, 85].forEach((d) => { s += `<line x1="${L}" x2="${W - 8}" y1="${Y(d)}" y2="${Y(d)}" stroke="rgb(var(--fg-rgb) / .15)" stroke-dasharray="3 5"/><text x="${L - 6}" y="${Y(d) + 3}" text-anchor="end" font-family="IBM Plex Mono" font-size="9" style="fill:var(--mut)">${d}</text>`; });
  N.eff.forEach((d, i) => { const c = d >= 85 ? 'var(--bad)' : d > 67 ? 'var(--warn)' : 'var(--earth)'; s += `<rect x="${L + i * bw + 2}" y="${Y(d)}" width="${bw - 4}" height="${Y(40) - Y(d)}" style="fill:${c}"><title>${i}:00 · ${Math.round(d)} dBA</title></rect>`; if (i % 3 === 0) s += `<text x="${L + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle" font-family="IBM Plex Mono" font-size="9" style="fill:var(--mut)">${i}h</text>`; });
  return s + '</svg>';
}
VIEWS['crew:tests'] = () => {
  const id = session.uid, lv = FV.lastTest(id, 'vis'), lm = FV.lastTest(id, 'mem'), la = FV.lastTest(id, 'att'), lau = FV.lastTest(id, 'aud'), N = FV.noiseDay(id);
  const firstM = FV.testsOf(id, 'mem')[0], firstA = FV.testsOf(id, 'att')[0];
  const memBox = mem.phase === 'show' ? `<p class="mem-seq" aria-live="polite">${mem.seq.split('').join(' ')}</p><p class="note">Memorizalos…</p>`
    : mem.phase === 'input' ? `<form class="adv-row" data-mem><label class="sr" for="memIn">Los números en orden</label><input id="memIn" inputmode="numeric" autocomplete="off" placeholder="Escribí los ${mem.len} números"><button type="submit" class="adv-send label">Listo</button></form>`
    : `<button type="button" class="btn label" id="memGo">${mem.phase === 'done' ? 'Repetir' : 'Empezar'} · 1 min</button>`;
  const stBox = stp.phase === 'run' && stp.cur ? `<p class="stroop" style="color:${stp.cur.ink[1]}">${stp.cur.word}</p><div class="seg">${COLORS.map(([n], j) => `<button type="button" data-stp="${j}">${n.charAt(0) + n.slice(1).toLowerCase()}</button>`).join('')}</div><p class="note">${stp.i + 1} de 12 · elegí el COLOR de la letra, no lo que dice.</p>`
    : `<button type="button" class="btn label" id="stpGo">${stp.phase === 'done' ? 'Repetir' : 'Empezar'} · 40 s</button>`;
  const audBox = aud.phase === 'run' ? `<p>Tono ${aud.i + 1} de 3 · ${AUD_F[aud.i] / 1000} kHz${aud.lvl ? ' · más fuerte' : ''}</p><div class="row-btns"><button type="button" class="btn-line label" id="audPlay">Volver a sonar</button><button type="button" class="btn label" data-aud="1">Lo escucho</button><button type="button" class="btn-line label" data-aud="0">No lo escucho</button></div>`
    : `<button type="button" class="btn label" id="audGo">${aud.phase === 'done' ? 'Repetir' : 'Empezar'} · con auriculares</button>`;
  return hello('Tests de salud', 'Cinco minutos por semana para prevenir.', 'Vista, memoria, atención y audición. Se comparan con tus propios resultados de la primera semana, no con los de otros.') +
  `<div class="cols c-2">
    ${panel(1, 'Vista · rejilla de Amsler', `<p class="note">En misiones largas, la vista puede cambiar porque los fluidos suben a la cabeza (síndrome SANS). Tapate un ojo, mirá el punto del centro a 30 cm y fijate si las líneas se ven derechas.</p>${amsler()}
      <div class="q"><p>Ojo izquierdo</p>${triad('L', [[0, 'Todo derecho'], [1, 'Líneas onduladas'], [2, 'Falta una zona']])}</div>
      <div class="q"><p>Ojo derecho</p>${triad('R', [[0, 'Todo derecho'], [1, 'Líneas onduladas'], [2, 'Falta una zona']])}</div>
      <div class="q"><p>¿Ves borroso de cerca?</p>${triad('blur', [[0, 'No'], [1, 'Un poco'], [2, 'Bastante']])}</div>
      <div class="q"><p>¿Te despertás con dolor de cabeza?</p>${triad('ache', [[0, 'No'], [1, 'A veces'], [2, 'Seguido']])}</div>
      <button type="button" class="btn label wide" id="vtSave">Guardar test de la vista</button><p class="note">${esc(vt.msg)}${lv ? ' Último: ' + FV.fmt(lv.ts) + ' · ' + esc(lv.detail) + '.' : ''}</p>`)}
    <div class="stack">
      ${panel(2, 'Memoria · números', `<p class="note">Aparecen números unos segundos; después escribilos en orden. Cada vez son más.</p>${memBox}<p class="note">${esc(mem.msg)}${lm ? ' Último: ' + lm.score + ' números' + (firstM ? ' · tu base: ' + firstM.score : '') + '.' : ''}</p>`)}
      ${panel(3, 'Atención · colores', `<p class="note">Aparece una palabra de color pintada de otro color. Tocá el color de la letra, rápido y sin equivocarte.</p>${stBox}<p class="note">${esc(stp.msg)}${la ? ' Último: ' + la.score + ' % de aciertos, ' + la.ms + ' ms' + (firstA ? ' · tu base: ' + firstA.score + ' %' : '') + '.' : ''}</p>`)}
      ${panel(4, 'Audición · chequeo rápido', `<p class="note">Suenan tres tonos (grave, medio y agudo). Decí si los escuchás. Es una orientación: no reemplaza la audiometría calibrada.</p>${audBox}<p class="note">${esc(aud.msg)}${lau ? ' Último: ' + esc(lau.detail) + '.' : ''}</p>`)}
    </div>
  </div>` +
  panel(5, 'Ruido de hoy', `<div class="noise-top"><p class="state-big" style="color:${FV.color(N.s)}">${Math.round(N.leq)} dBA</p><p class="note">Exposición equivalente de 24 h. Límite NASA-STD-3001: ${FV.NOISE_LIM} dBA. Con más de 85 dBA, protectores siempre.</p></div>${noiseChart(N)}
    <div class="inline"><span class="label">Horas con protectores auditivos</span><div class="seg">${[0, 1, 2, 3, 4].map((h) => `<button type="button" data-hpd="${h}" aria-pressed="${N.prot === h}">${h}</button>`).join('')}</div></div>
    <p class="note">${N.s ? 'Te pasaste del límite: usá protectores en la cinta, la bicicleta y el taller.' : 'Dentro del límite.'} Al dormir: ${Math.round(N.sleep)} dBA promedio.</p>`);
};
function memNext() {
  mem.seq = Array.from({length: mem.len}, () => Math.floor(Math.random() * 10)).join(''); mem.phase = 'show'; render();
  setTimeout(() => { mem.phase = 'input'; render(); const i = $('#memIn'); if (i) i.focus(); }, 900 + mem.len * 650);
}
function memAnswer(v) {
  if (v.replace(/\D/g, '') === mem.seq) { mem.best = mem.len; mem.len = Math.min(10, mem.len + 1); mem.msg = '¡Bien!'; if (mem.len === 10 && mem.best === 10) return memEnd(); memNext(); }
  else if (++mem.fails >= 2) memEnd();
  else { mem.msg = 'Casi. Probemos otra del mismo largo.'; memNext(); }
}
function memEnd() {
  const base = FV.testsOf(session.uid, 'mem')[0], s = mem.best < 5 || (base && mem.best < base.score - 1) ? 1 : 0;
  FV.saveTest(session.uid, 'mem', {score: mem.best, s}); mem.phase = 'done';
  mem.msg = `Recordaste hasta ${mem.best} números.` + (s ? ' Está por debajo de tu base: descansá y repetilo mañana.' : ' Bien.');
  if (window.FVLive) FVLive.speak(mem.msg); render();
}
function stpNext() {
  if (stp.i >= 12) {
    const acc = Math.round(stp.ok / 12 * 100), ms = Math.round(stp.ms.reduce((a, b) => a + b, 0) / Math.max(1, stp.ms.length));
    const base = FV.testsOf(session.uid, 'att')[0], s = acc < 75 || (base && acc < base.score - 15) ? 1 : 0;
    FV.saveTest(session.uid, 'att', {score: acc, ms, s}); stp.phase = 'done';
    stp.msg = `${acc} % de aciertos, ${ms} ms por respuesta.` + (s ? ' Está por debajo de tu base.' : ' Bien.'); if (window.FVLive) FVLive.speak(stp.msg); render(); return;
  }
  const w = COLORS[Math.floor(Math.random() * 4)], ink = Math.random() < 0.3 ? w : COLORS.filter((c) => c !== w)[Math.floor(Math.random() * 3)];
  stp.cur = {word: w[0], ink}; stp.t0 = performance.now(); render();
}
function audPlay() { tone(AUD_F[aud.i], AUD_G[aud.lvl]); }
function audAnswer(heard) {
  const f = AUD_F[aud.i];
  if (heard) { aud.res[f] = aud.lvl; aud.i++; aud.lvl = 0; }
  else if (aud.lvl === 0) aud.lvl = 1;
  else { aud.res[f] = 2; aud.i++; aud.lvl = 0; }
  if (aud.i >= AUD_F.length) {
    const bad = AUD_F.filter((x) => aud.res[x] === 2), soft = AUD_F.filter((x) => aud.res[x] === 1);
    const s = bad.length ? 2 : soft.length ? 1 : 0;
    const detail = s === 0 ? 'Escuchó los tres tonos suaves' : (bad.length ? 'No escuchó ' + bad.map((x) => x / 1000 + ' kHz').join(' y ') : 'Necesitó más volumen en ' + soft.map((x) => x / 1000 + ' kHz').join(' y '));
    FV.saveTest(session.uid, 'aud', {s: Math.min(s, 1), detail}); aud.phase = 'done';
    aud.msg = detail + '.' + (s ? ' Conviene una audiometría con el oficial médico.' : ''); if (window.FVLive) FVLive.speak(aud.msg); render(); return;
  }
  render(); setTimeout(audPlay, 300);
}

/* ---------- Botiquín (oficial médico) ---------- */
VIEWS['med:kit'] = () => {
  const kit = S().kit || [], rows = kit.map((it) => ({it, k: FV.kitStatus(it)})).sort((a, b) => b.k.s - a.k.s);
  return hello('Botiquín', 'Lo que hay a bordo, y lo que falta.', 'En el espacio algunos medicamentos se degradan antes por la radiación. La app avisa los que vencen, los vencidos y los que quedan pocos. Solo inventario: las indicaciones y dosis las decide el oficial médico.') +
    panel(1, 'Inventario', `<div class="wx"><table><thead><tr><th>Medicamento</th><th>Para</th><th>Quedan</th><th>Vence</th><th>Estado</th><th></th></tr></thead><tbody>${rows.map(({it, k}) => `<tr><td><b>${esc(it.n)}</b></td><td>${esc(it.use)}</td><td>${it.q} <small class="dim">(mín. ${it.min})</small></td><td>${new Date(it.exp).toLocaleDateString('es-AR')}</td><td>${k.w.length ? k.w.map(([s, t]) => st(s, t)).join(' ') : st(0, 'En orden')}</td><td><button type="button" class="btn-line label" data-kituse="${it.id}" ${it.q <= 0 ? 'disabled' : ''}>Registrar uso</button></td></tr>`).join('')}</tbody></table></div>
      <div class="inline"><label class="label" for="kitWho">Para quién</label><select id="kitWho">${FV.CREW.map((m) => `<option value="${m.id}">${m.name}</option>`).join('')}</select></div>
      <p class="note">Cada uso queda registrado con hora y tripulante. Los vencidos se separan y se pide reposición en el próximo envío de carga.</p>`) +
    panel(2, 'Últimos usos', (() => { const l = kit.flatMap((it) => it.log.map((x) => ({...x, n: it.n}))).sort((a, b) => b.ts - a.ts).slice(0, 8); return l.length ? `<ol class="log">${l.map((x) => `<li><span class="label dim">${FV.fmt(x.ts)}</span><span>${esc(x.n)} · ${crew(x.uid).name}</span></li>`).join('')}</ol>` : '<p class="note">Sin usos registrados.</p>'; })());
};

/* ---------- Consulta con la Tierra (oficial médico) ---------- */
let conMsg = '', conMedia = [];
const hhmm = (t) => new Date(t).toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit', second: '2-digit'});
function consultStage(c) {
  const now = Date.now();
  if (now < c.demo.arrive) return [0, 'En camino a la Tierra'];
  if (now < c.demo.replyAt) return [1, 'Recibida en la Tierra · respondiendo'];
  return [2, 'Respuesta recibida'];
}
VIEWS['med:tierra'] = () => {
  const C = FV.comms(), env = FV.envOf(), list = (S().consults || []).slice().reverse(), sel = medSel;
  const E = FV.news2(sel), I = FV.ind(sel);
  return hello('Consulta con la Tierra', 'Sin conexión en vivo.', `Desde ${env.n} un mensaje tarda ${FV.dur(C.oneWay * 1000)} en llegar a la Tierra y lo mismo en volver. ${C.note} Armá un paquete con todo lo necesario para que el cirujano de vuelo responda en un solo viaje.`) +
  `<div class="comms" style="--c:var(--earth)"><div><span class="label">Ida</span><b>${FV.dur(C.oneWay * 1000)}</b></div><div><span class="label">Ida y vuelta</span><b>${FV.dur(C.oneWay * 2000)}</b></div><div><span class="label">Próxima ventana</span><b>${FV.nextWindow(Date.now()) <= Date.now() ? 'Ahora' : hhmm(FV.nextWindow(Date.now()))}</b></div><label class="comms-fast"><input type="checkbox" id="fastDemo" ${S().commsFast !== false ? 'checked' : ''}> Demo acelerada</label></div>` +
  medPick() +
  `<div class="cols c-2">${panel(1, 'Armar el paquete', `<p class="note">Se adjunta solo: signos vitales, puntaje de alerta temprana (${E.total}), sueño, últimos tests y ruido del día de ${crew(sel).name}.</p>
      <dl class="facts"><div><dt class="label">Pulso</dt><dd>${I.hr.val} lpm</dd></div><div><dt class="label">Oxígeno</dt><dd>${I.spo2.val} %</dd></div><div><dt class="label">Temperatura</dt><dd>${I.temp.val} °C</dd></div><div><dt class="label">Alerta temprana</dt><dd style="color:${FV.color(Math.min(E.s, 3))}">${E.total}</dd></div></dl>
      <label class="sr" for="conText">Síntomas y pregunta</label><textarea id="conText" class="fam-text" rows="4" placeholder="Síntomas, desde cuándo, qué se hizo y qué querés preguntar…"></textarea>
      ${conMedia.length ? `<div class="fam-media">${conMedia.map((m) => `<img class="fam-img" src="${mediaSrc(m.id)}" alt="Imagen adjunta">`).join('')}</div>` : ''}
      <div class="row-btns"><label class="btn-line label fam-file">Adjuntar foto<input type="file" id="conPhoto" accept="image/*" capture="environment" hidden></label><button type="button" class="btn label" id="conSend">Enviar a la Tierra →</button></div><p class="note">${esc(conMsg)}</p>`)}
    ${panel(2, 'Consultas', list.length ? `<ol class="fam-list">${list.map((c) => { const [k, t] = consultStage(c); return `<li class="out"><span class="label dim">${crew(c.uid).name} · ${FV.fmt(c.ts)}</span><p>${esc(c.text || '(sin texto)')}</p>
      <ol class="con-steps"><li class="${k >= 0 ? 'on' : ''}">Enviada · ${hhmm(c.ts)}</li><li class="${k >= 1 ? 'on' : ''}">Llega a la Tierra · ${hhmm(c.real.arrive)}</li><li class="${k >= 2 ? 'on' : ''}">Respuesta · ${hhmm(c.real.replyAt)}</li></ol>
      <span class="label ${k === 2 ? 'c-ok' : 'c-earth'}">${t}${S().commsFast !== false && k < 2 ? ' · demo acelerada' : ''}</span>${k === 2 ? `<p class="con-reply">${esc(c.reply)}</p>` : ''}</li>`; }).join('')}</ol>` : '<p class="note">Todavía no hay consultas.</p>')}</div>`;
};

/* ======================================================================
   FAMILIA Y DIARIO · bienestar emocional
   Basado en lo que hace la NASA en misiones largas (Behavioral Health &
   Performance): conferencias psicológicas privadas cada dos semanas,
   charlas con la familia, mensajes y fotos, y escribir un diario (el estudio
   «Journals» de la NASA analizó los diarios de astronautas de la ISS).
   - El diario es PRIVADO: no lo ve nadie, ni el Comandante ni el médico.
     Única excepción: si aparece riesgo de hacerse daño, el asistente avisa
     al oficial médico (y se lo dice a la persona).
   - Mensajes, fotos y audios para la familia: se guardan en este navegador
     y salen en la próxima ventana de comunicación (envío simulado).
   - El asistente acompaña, pero no reemplaza al psicólogo de la misión.
   ====================================================================== */
const IDB = (() => {
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('favaloro', 1); r.onupgradeneeded = () => r.result.createObjectStore('media'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('media', mode), q = fn(t.objectStore('media')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); };
  return {put: (k, v) => tx('readwrite', (s) => s.put(v, k)), get: (k) => tx('readonly', (s) => s.get(k))};
})();
const mediaURL = {};
function mediaSrc(id) {
  if (mediaURL[id]) return mediaURL[id];
  mediaURL[id] = '';
  IDB.get(id).then((b) => { if (b) { mediaURL[id] = URL.createObjectURL(b); if (tab === 'familia') render(); } }).catch(() => {});
  return '';
}
const fam = () => { const s = S(); s.family = s.family || {}; s.diary = s.diary || {}; s.ppc = s.ppc || []; return s; };
function famSeed(uid) {
  const f = fam().family; if (f[uid]) return f[uid];
  const d = Date.now();
  f[uid] = {out: [], in: [
    {id: FV.nid(), ts: d - 864e5 * 2, from: 'Tu familia', t: '¡Hola! Hoy miramos juntos el cielo y nos acordamos de vos. Te mandamos un abrazo enorme. Contanos cómo está la Tierra desde ahí.'},
    {id: FV.nid(), ts: d - 864e5 * 0.4, from: 'Tu familia', t: 'Ya preparamos la lista de cosas para hacer cuando vuelvas. Te extrañamos mucho, pero estamos orgullosos.'},
  ]};
  FV.save(); return f[uid];
}
const DIARY_P = [
  '¿Qué fue lo mejor de tu día, aunque sea algo chiquito?',
  '¿A quién extrañás hoy y qué le contarías si estuviera acá?',
  '¿Qué te gustaría hacer con tu familia cuando vuelvas?',
  '¿Qué te costó hoy? Contámelo sin filtro: queda solo para vos.',
  'Nombrá tres cosas por las que hoy te sentís agradecido.',
  '¿Qué ves por la ventana que te gustaría mostrarle a alguien?',
];
const diary = {log: [], n: 0, turns: 0, msg: ''};
function diaryStart() {
  if (diary.log.length) return;
  diary.n = new Date().getDate() % DIARY_P.length;
  diary.log.push({who: 'bot', t: 'Este es tu diario. Es privado: no lo ve nadie más, ni el Comandante ni el médico. Escribí o hablá como te salga. ' + DIARY_P[diary.n]});
}
// Respuesta del diario sin IA: escucha, valida y sigue con otra pregunta suave.
function diaryReply(text) {
  const t = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const tp = FV.topicAnswer(text);
  if (tp && tp.g >= 3) return {t: tp.a + ' Esto es importante: le aviso al oficial médico para que te acompañe. Solo le digo que necesitás ayuda, no lo que escribiste.', alert: tp.t};
  diary.turns++;
  let r;
  if (/extran|familia|hij|mama|papa|pareja|novi|espos|casa|herman|perro|gato/.test(t)) r = 'Se nota cuánto los querés. Extrañar es parte de estar lejos, y también muestra lo importante que son. ¿Querés mandarles algo? Abajo podés escribirles, mandarles una foto o grabarles un audio.';
  else if (/trist|mal|sol[oa]|angust|llor|cansad|agotad|bajon/.test(t)) r = 'Gracias por escribirlo; ponerlo en palabras ya ayuda. Es normal tener días así lejos de casa. Si se repite varios días, hablarlo con el psicólogo de la misión puede hacerte bien.';
  else if (/bien|lind|feliz|content|genial|incre|hermos|risa|rei/.test(t)) r = 'Qué bueno. Guardar estos momentos sirve para los días más difíciles.';
  else r = 'Te leo. Gracias por contármelo.';
  if (diary.turns % 2 === 0) { diary.n = (diary.n + 1) % DIARY_P.length; r += ' Si querés seguir: ' + DIARY_P[diary.n]; }
  return {t: r};
}
async function diarySay(text) {
  diary.log.push({who: 'me', t: text}); diary.msg = '';
  let rep = null;
  if (window.FVAI && FVAI.enabled()) {
    const wait = {who: 'bot', t: '', wait: true}; diary.log.push(wait); render();
    try {
      const sys = `Sos el acompañante del diario personal de ${crew(session.uid).name}, astronauta en ${FV.envOf().n}, lejos de su familia. Español rioplatense con voseo, cálido, breve (máximo 50 palabras), sin listas. Escuchá, validá lo que siente y, si corresponde, hacé UNA pregunta suave para seguir escribiendo. No diagnostiques ni des consejos médicos. Si aparece riesgo de hacerse daño, decile con cuidado que avise ya al oficial médico. Sos una IA y no reemplazás al psicólogo de la misión.${AI_LANG()}`;
      const txt = await Promise.race([FVAI.ask(sys, diary.log.filter((m) => !m.wait), false), new Promise((_, rej) => setTimeout(() => rej(new Error('lenta')), 10000))]);
      diary.log.splice(diary.log.indexOf(wait), 1);
      const risk = FV.topicAnswer(text);
      rep = {t: txt, ai: true, alert: risk && risk.g >= 3 ? risk.t : null};
    } catch (e) { diary.log.splice(diary.log.indexOf(wait), 1); }
  }
  rep = rep || diaryReply(text);
  diary.log.push({who: 'bot', t: rep.t, ai: rep.ai});
  if (rep.alert) FV.sos(session.uid, 'necesita acompañamiento (señal de riesgo en su diario personal; el contenido es privado)');
  render();
  if (window.FVLive) FVLive.speakNew('diario', diary.log);
  const lg = $('#diaryLog'); if (lg) lg.scrollTop = lg.scrollHeight;
}
function diarySave() {
  const mine = diary.log.filter((m) => m.who === 'me').map((m) => m.t);
  if (!mine.length) { diary.msg = 'Todavía no escribiste nada.'; render(); return; }
  const d = fam().diary; (d[session.uid] = d[session.uid] || []).push({id: FV.nid(), ts: Date.now(), t: mine.join('\n')});
  FV.save(); diary.log = []; diary.turns = 0; diary.msg = 'Guardado en tu diario. Solo vos lo podés leer.'; render();
}
/* Mensaje para la familia: texto, fotos y audios. */
const famDraft = {media: [], msg: '', rec: null, recT: 0};
async function addPhoto(file, into) {
  try {
    const bmp = await createImageBitmap(file), k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.82));
    const id = 'm' + FV.nid(); await IDB.put(id, blob); mediaURL[id] = URL.createObjectURL(blob);
    (into || famDraft.media).push({id, type: 'img'}); render();
  } catch (e) { famDraft.msg = 'No pude cargar esa foto.'; render(); }
}
async function toggleRec() {
  if (famDraft.rec) { famDraft.rec.stop(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    const rec = new MediaRecorder(stream), parts = [];
    rec.ondataavailable = (e) => parts.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop()); clearTimeout(famDraft.recT); famDraft.rec = null;
      const blob = new Blob(parts, {type: rec.mimeType || 'audio/webm'}), id = 'm' + FV.nid();
      await IDB.put(id, blob); mediaURL[id] = URL.createObjectURL(blob);
      famDraft.media.push({id, type: 'audio'}); render();
    };
    rec.start(); famDraft.rec = rec; famDraft.recT = setTimeout(() => rec.state === 'recording' && rec.stop(), 60000);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    render();
  } catch (e) { famDraft.msg = 'No pude usar el micrófono: permitilo en el candado de la barra de direcciones.'; render(); }
}
function famSend() {
  const t = ($('#famText') || {}).value || '';
  if (!t.trim() && !famDraft.media.length) { famDraft.msg = 'Escribí algo o agregá una foto o un audio.'; render(); return; }
  // Sale en la próxima ventana de comunicación y tarda lo que tarda la luz hasta la Tierra.
  const f = famSeed(session.uid), now = Date.now(), m = {id: FV.nid(), ts: now, t: t.trim(), media: famDraft.media.slice(), plan: FV.msgPlan(now)};
  f.out.push(m); FV.save();
  famDraft.media = []; famDraft.msg = ''; if ($('#famText')) $('#famText').value = '';
  setTimeout(() => { if (tab === 'familia') render(); }, m.plan.demo.arrive - now + 200);
  render();
}
function famStatus(m) {
  if (!m.plan) return 'Entregado ✓';
  const now = Date.now(), r = m.plan.real;
  if (now >= m.plan.demo.arrive) return 'Entregado en la Tierra ✓ · ' + new Date(r.arrive).toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit'});
  return (r.send > m.ts ? 'Esperando el próximo pase del orbitador · ' : 'En camino · ') + 'llega ' + new Date(r.arrive).toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit', second: '2-digit'}) + ' (' + FV.dur(r.arrive - m.ts) + ')';
}
let breath = null;
function breathe() {
  if (breath) { clearInterval(breath.t); breath = null; if ('speechSynthesis' in window) speechSynthesis.cancel(); render(); return; }
  breath = {n: 0, ph: 'in'};
  const step = () => {
    if (!breath) return;
    if (breath.n >= 6) { clearInterval(breath.t); breath = null; if (window.FVLive) FVLive.speak('Muy bien. Terminamos. ¿Cómo te sentís ahora?'); render(); return; }
    breath.ph = breath.ph === 'in' ? 'out' : 'in'; if (breath.ph === 'in') breath.n++;
    if (window.FVLive) FVLive.speak(breath.ph === 'in' ? 'Inhalá' : 'Exhalá despacio');
    const el = $('#breath'); if (el) { el.dataset.ph = breath.ph; el.querySelector('b').textContent = breath.ph === 'in' ? 'Inhalá · 4' : 'Exhalá · 6'; }
  };
  breath.ph = 'out'; step();
  breath.t = setInterval(step, 5000);
  render();
}
const GROUND = 'Probemos algo para bajar la ansiedad. Mirá a tu alrededor y nombrá 5 cosas que ves. Después, 4 cosas que podés tocar. Después, 3 sonidos que escuchás. 2 olores. Y 1 cosa que te guste de vos. Tomate tu tiempo.';
VIEWS['crew:familia'] = () => {
  diaryStart();
  const uid = session.uid, f = famSeed(uid), entries = (fam().diary[uid] || []).slice().reverse(), lat = FV.envOf().lat;
  const ppc = fam().ppc.filter((p) => p.uid === uid && Date.now() - p.ts < 864e5 * 14).pop();
  const on = !!(window.FVLive && FVLive.talking('diaryQ'));
  const media = (list) => list.map((m) => m.type === 'img' ? `<img class="fam-img" src="${mediaSrc(m.id)}" alt="Foto adjunta">` : `<audio controls src="${mediaSrc(m.id)}"></audio>`).join('');
  return hello('Familia y diario', 'Lejos de casa, cerca de los tuyos.', 'Un diario privado para descargar lo que sentís, mensajes con fotos y audios para tu familia, y apoyo psicológico cuando lo necesites. Como en las misiones largas de la NASA.') +
  `<div class="cols c-2">
    <section class="panel hud chat">${ph(1, 'Mi diario', '<span class="label dim">Privado · solo vos</span>')}
      <ol class="adv-conv chat-scroll" id="diaryLog" aria-live="polite">${diary.log.map((m) => m.who === 'me' ? `<li class="me">${esc(m.t)}</li>` : `<li class="bot"><span class="who">Diario${m.ai ? ' · IA' : ''}</span>${m.wait ? '<span class="adv-typing"><i></i><i></i><i></i></span>' : esc(m.t)}</li>`).join('')}</ol>
      <form class="adv-row" data-diary><button type="button" class="adv-talk" data-talk="diaryQ" aria-pressed="${on}"><span class="adv-wave" aria-hidden="true"><i></i><i></i><i></i></span><span class="lbl">${on ? 'Pausar' : 'Hablar'}</span></button><label class="sr" for="diaryQ">Escribí en tu diario</label><input type="text" id="diaryQ" maxlength="600" autocomplete="off" placeholder="Escribí lo que sientas…"><button type="submit" class="adv-send label">Enviar</button></form>
      <div class="row-btns"><button type="button" class="btn label" id="diarySave">Guardar en mi diario</button><button type="button" class="btn-line label" id="diaryNew">Otra pregunta</button><span class="label dim">${esc(diary.msg)}</span></div>
      ${entries.length ? `<details class="fam-old"><summary class="label">Mis entradas (${entries.length})</summary><ol>${entries.map((e) => `<li><span class="label dim">${FV.fmt(e.ts)}</span><p>${esc(e.t)}</p></li>`).join('')}</ol></details>` : ''}
      <p class="adv-how">Si escribís algo que muestre riesgo de hacerte daño, el asistente avisa al oficial médico para que te acompañe, sin mostrarle lo que escribiste.</p>
    </section>
    <div class="stack">
      <section class="panel hud">${ph(2, 'Para tu familia', `<span class="label dim">Tarda ${FV.dur(FV.comms().oneWay * 1000)} en llegar${FV.comms().every ? ' · sale en el próximo pase' : ''}</span>`)}
        <label class="sr" for="famText">Mensaje para tu familia</label>
        <textarea id="famText" rows="4" maxlength="1500" placeholder="Contales cómo estás, qué viste hoy, qué extrañás…"></textarea>
        <div class="adv-optrow">${['Hoy vi la Tierra y pensé en ustedes', 'Los extraño mucho', 'Les cuento cómo es un día acá'].map((x) => `<button type="button" data-famidea="${esc(x)}">${esc(x)}</button>`).join('')}</div>
        ${famDraft.media.length ? `<div class="fam-media">${media(famDraft.media)}</div>` : ''}
        <div class="row-btns"><label class="btn-line label fam-file">Agregar foto<input type="file" id="famPhoto" accept="image/*" capture="environment" hidden></label><button type="button" class="btn-line label${famDraft.rec ? ' c-bad' : ''}" id="famRec" aria-pressed="${!!famDraft.rec}">${famDraft.rec ? '● Grabando · tocá para terminar' : 'Grabar audio'}</button><button type="button" class="btn label" id="famSend">Enviar →</button></div>
        <p class="note">${esc(famDraft.msg)}</p>
        ${f.out.length ? `<p class="label sub">Enviados</p><ol class="fam-list">${f.out.slice().reverse().map((m) => `<li class="out"><span class="label dim">${FV.fmt(m.ts)} · ${famStatus(m)}</span>${m.t ? `<p>${esc(m.t)}</p>` : ''}${m.media && m.media.length ? `<div class="fam-media">${media(m.media)}</div>` : ''}</li>`).join('')}</ol>` : ''}
      </section>
      <section class="panel hud">${ph(3, 'De tu familia', '<span class="label dim">simulado</span>')}
        <ol class="fam-list">${f.in.slice().reverse().map((m) => `<li><span class="label c-earth">${esc(m.from)} · ${FV.fmt(m.ts)}</span><p>${esc(m.t)}</p></li>`).join('')}</ol>
        <div class="row-btns"><button type="button" class="btn-line label" data-famread>Que me lo lea en voz alta</button></div>
      </section>
      <section class="panel hud">${ph(4, 'Apoyo psicológico')}
        <p class="note">En la NASA, cada tripulante tiene una charla privada con su psicólogo cada dos semanas. Si la necesitás antes, pedila: el oficial médico solo ve que la pediste, no por qué.</p>
        <div class="row-btns">${ppc ? `<span class="label c-ok">Conferencia pedida ✓ · ${FV.fmt(ppc.ts)} · próxima ventana</span>` : '<button type="button" class="btn label" id="ppcAsk">Pedir charla con el psicólogo</button>'}</div>
        <p class="label sub">Ejercicios guiados, con voz</p>
        <div class="row-btns"><button type="button" class="btn-line label" id="breathBtn">${breath ? 'Terminar respiración' : 'Respiración 4-6 · 1 min'}</button><button type="button" class="btn-line label" id="groundBtn">Anclaje 5-4-3-2-1</button></div>
        ${breath ? `<div class="breath" id="breath" data-ph="${breath.ph}"><i></i><b>${breath.ph === 'in' ? 'Inhalá · 4' : 'Exhalá · 6'}</b></div>` : ''}
        <p class="adv-how">El asistente acompaña, pero no reemplaza al psicólogo de la misión. Si sentís que no podés más, tocá «Pedir ayuda».</p>
      </section>
    </div>
  </div>`;
};
VIEWS['crew:hist'] = () => {
  const id = session.uid, d = daily(id), days = Object.keys(d).sort();
  const ser = [{name: 'Malestar', color: PAL[0], k: null}, {name: 'Sueño', color: PAL[1], k: 'sleep'}, {name: 'Ánimo', color: PAL[2], k: 'mood'}, {name: 'Ansiedad', color: PAL[3], k: 'anx'}, {name: 'Estrés', color: PAL[4], k: 'str'}]
    .map((x) => ({...x, pts: days.map((y, i) => ({i, v: Math.round(x.k ? d[y].ds[x.k] : d[y].idx)})).filter((p) => !isNaN(p.v))}));
  const rg = FV.regsOf(id).slice(-7).reverse();
  return hello('Historial', 'Cómo vengo estos días.') +
    panel(1, 'Mente y estrés por día', days.length ? chart(ser, days, 240) : '<p class="note">Todavía no hay chequeos.</p>') +
    panel(2, 'Registros recientes', `<div class="wx"><table><thead><tr><th>Fecha</th><th>Glucosa</th><th>Presión</th><th>Reacción</th><th>Ánimo</th></tr></thead><tbody>${rg.map((r) => `<tr><td>${FV.fmt(r.ts)}</td><td>${r.glu ?? '—'}</td><td>${r.sys ? r.sys + '/' + r.dia : '—'}</td><td>${r.react ?? '—'}</td><td>${r.mood ?? '—'}</td></tr>`).join('')}</tbody></table></div>`);
};

/* ---------------- COMANDANTE ---------------- */
VIEWS['cmd:rep'] = () => {
  const sg = FV.suggestions(), cnt = [0, 0, 0, 0];
  FV.CREW.forEach((m) => cnt[FV.combined(m.id).s]++);
  const approved = new Set(S().decisions.filter((d) => FV.dayOf(d.ts) === today()).map((d) => d.key));
  return hello('Parte del día · ' + new Date().toLocaleDateString('es-AR', {weekday: 'long', day: 'numeric', month: 'long'}), 'Tripulación.',
    `<span class="tally label">${['En rango', 'A vigilar', 'Alerta', 'Emergencia'].map((t, i) => `<span style="--c:${FV.color(i)}"><b>${cnt[i]}</b> ${t}</span>`).join('')}</span>`) +
  `<div class="crows">${FV.CREW.map((m) => crewRow(m, 'cmd')).join('')}</div>
  ${panel(1, 'Decisiones sugeridas', sg.length ? `<ol class="sugg">${sg.map((x, i) => { const key = x.who + '|' + x.t.slice(0, 40); return `<li style="--c:${FV.color(Math.min(x.p, 3))}"><span class="label">${pad(i + 1)}</span><div><p class="label" style="color:var(--c)">${['Prioridad baja', 'Prioridad media', 'Prioridad alta', 'Urgente'][Math.min(x.p, 3)]} · ${x.who}</p><p>${x.t}</p></div>${approved.has(key) ? '<span class="label c-ok">Aprobada</span>' : `<button type="button" class="btn-line label" data-approve="${esc(key)}" data-text="${esc(x.who + ': ' + x.t)}" data-focus="ap${i}">Aprobar</button>`}</li>`; }).join('')}</ol>` : '<p class="note">Sin decisiones pendientes: la tripulación está en rango.</p>')}
  <p class="note">El parte cruza mente, nutrición y brazalete. Lo clínico lo decide el oficial médico.</p>`;
};
let repMsg = '';
VIEWS['cmd:reportes'] = () => {
  const sent = S().sent.slice().sort((a, b) => b.ts - a.ts);
  const box = (i, kind, t) => panel(i, t, `<pre class="rep" tabindex="0">${esc(FV.report(kind))}</pre><div class="row-btns"><button type="button" class="btn label" data-send="${kind}">Enviar a Control de Misión →</button><button type="button" class="btn-line label" data-dl="${kind}">Descargar .txt</button><button type="button" class="btn-line label" data-copy="${kind}">Copiar</button></div>`);
  return hello('Reportes', 'Lo que se envía a la Tierra.', 'El reporte diario resume las últimas 24 horas; el semanal, los últimos 7 días con tendencias. Se arman solos con los datos de la misión.') +
    (repMsg ? `<p class="okmsg label">${repMsg}</p>` : '') +
    `<div class="cols c-2">${box(1, 'dia', 'Reporte diario')}${box(2, 'semana', 'Reporte semanal')}</div>` +
    panel(3, 'Enviados', sent.length ? `<ol class="log">${sent.map((r) => `<li><span class="label dim">${FV.fmt(r.ts)}</span><span>${r.kind === 'semana' ? 'Reporte semanal' : 'Reporte diario'} · enviado a Control de Misión · llega en ${FV.envOf().lat}</span></li>`).join('')}</ol>` : '<p class="note">Todavía no enviaste reportes.</p>');
};
let decMsg = '';
VIEWS['cmd:dec'] = () => {
  const ds = S().decisions.slice().sort((a, b) => b.ts - a.ts);
  return hello('Decisiones', 'Registro del comandante.') +
    panel(1, 'Nueva decisión', `<div class="field"><label for="dText" class="label">Qué se decidió</label><textarea id="dText" rows="2" maxlength="300" placeholder="Ej.: Astronauta 3 descansa el turno de la tarde; la maniobra pasa a Astronauta 1."></textarea></div><button type="button" class="btn label" id="dSave">Guardar →</button><p class="note">${decMsg}</p>`) +
    panel(2, 'Historial', ds.length ? `<ol class="log">${ds.map((d) => `<li><span class="label dim">${FV.fmt(d.ts)}</span><span>${esc(d.text)}</span></li>`).join('')}</ol>` : '<p class="note">Todavía no hay decisiones. Aprobá una sugerencia del parte o escribí una.</p>');
};
let emLv = 3;
VIEWS['cmd:emg'] = () => hello('Emergencias', 'Qué hacer según la gravedad.') + protoPanel(0) +
  `<div class="cols c-2">${panel(1, 'Llamar a un tripulante', `<p class="note">Si alguien no contesta en ${FV.CALL_S} s, FAVALORO avisa solo al compañero más cercano, al oficial médico y a Control de Misión.</p><div class="call-list">${FV.CREW.map((m) => `<div class="cl-row"><span><b>${m.name}</b> ${st(FV.combined(m.id).s)}</span><button type="button" class="btn-line label c-bad" data-call="${m.id}" data-focus="ec${m.id}">Llamar</button></div>`).join('')}</div>`)}
  ${panel(2, 'Pasos fijos', `<ol class="steps"><li>Alarma de a bordo y aviso a toda la tripulación.</li><li>Oficial médico al lugar con el equipo médico.</li><li>Aviso a Control de Misión: estado, hora y acciones (demora ${FV.envOf().lat}).</li><li>Recuento de tripulantes y registro de la decisión.</li></ol>`)}</div>` +
  panel(3, 'Protocolo por gravedad', protocol(emLv));
VIEWS['cmd:evo'] = () => {
  const days = [...new Set(FV.CREW.flatMap((m) => Object.keys(daily(m.id))))].sort();
  const ser = FV.CREW.map((m, k) => { const d = daily(m.id); return {name: m.name, color: PAL[k], pts: days.map((x, i) => (d[x] ? {i, v: d[x].idx} : null)).filter(Boolean)}; });
  return hello('Evolución', 'Cómo viene la tripulación.') + panel(1, 'Malestar por día · más alto es peor', chart(ser, days, 260)) +
    panel(2, 'Mente y nutrición, juntas', `<div class="wx"><table><thead><tr><th>Tripulante</th><th>Mente</th><th>Nutrición</th><th>Combinado</th><th>Señales</th></tr></thead><tbody>${FV.CREW.map((m) => { const c = FV.combined(m.id); return `<tr><td><b>${m.name}</b></td><td>${c.c ? st(c.c.s, FV.STATE[c.c.s] + ' · ' + c.c.idx) : st(null)}</td><td>${st(c.n.s)}</td><td>${st(c.s)}</td><td>${c.f.join(' + ') || '—'}</td></tr>`; }).join('')}</tbody></table></div><p class="note">Si coinciden poca ingesta o pérdida de peso, ánimo bajo y mal sueño, el estado sube a Alerta aunque cada señal sola sea leve.</p>`);
};
function protocol(lv) {
  const L = FV.AL[lv];
  return `<div class="lvs" role="group" aria-label="Gravedad">${FV.AL.map((x, i) => `<button type="button" data-lv="${i}" aria-pressed="${i === lv}" style="--c:${x.c}"><i></i>${x.n}</button>`).join('')}</div>
  <p class="lv-d"><span class="st" style="--c:${L.c}">${L.n}</span> ${L.d}</p>
  ${L.it.map((it) => `<details class="cs"><summary>${it[0]}</summary><ol>${it[1].split('|').map((s) => `<li>${s}</li>`).join('')}</ol></details>`).join('')}`;
}

/* ---------------- ESPECIALISTA DE MISIÓN ---------------- */
VIEWS['esp:env'] = () => {
  const e = FV.envOf();
  return hello('Entorno de la misión', e.n + '.', e.sub) +
  `<div class="env-pick" role="radiogroup" aria-label="Entorno">${Object.entries(FV.ENV).map(([k, x], i) => `<button type="button" role="radio" aria-checked="${S().env === k}" data-env="${k}" data-focus="env${k}"><span class="label c-earth">${pad(i + 1)}</span><b>${x.n}</b><small>${x.sub}</small></button>`).join('')}</div>
  <section class="panel hud">${ph(1, 'Características')}<dl class="facts">${[['Gravedad', e.g], ['Radiación', e.rad], ['Demora con la Tierra', e.lat], ['Distancia', e.dist], ['Temperatura exterior', e.ext]].map(([k, v]) => `<div><dt class="label">${k}</dt><dd>${v}</dd></div>`).join('')}</dl></section>
  ${panel(2, 'Peligros del entorno', `<p class="lead">${e.haz}.</p><p class="note">Valores orientativos de referencia (ISS, Chang'e 4 y Curiosity). Cambiar el entorno actualiza los riesgos y el parte del comandante.</p>`)}`;
};
const shipH = {p: [], o2: [], co2: [], t: [], hu: []};
setInterval(() => { Object.keys(shipH).forEach((k) => { shipH[k].push(FV.ship[k]); if (shipH[k].length > 40) shipH[k].shift(); }); }, 1000);
VIEWS['esp:nave'] = () => {
  const sh = FV.ship, R = FV.SHIPR, fail = S().co2Target > 3.5;
  const items = [['p', 'Presión de cabina', sh.p.toFixed(1).replace('.', ','), 'kPa', '97–103 kPa'], ['o2', 'Oxígeno', FV.f1(sh.o2), '%', '19,5–23,5 %'], ['co2', 'CO₂', FV.f1(sh.co2), 'mmHg', '≤ 3 mmHg prom. 1 h · NASA-STD-3001'], ['t', 'Temperatura', FV.f1(sh.t), '°C', '18–27 °C'], ['hu', 'Humedad', Math.round(sh.hu), '%', '25–70 %']];
  return hello('Nave y hábitat', 'El aire que respira la tripulación.') +
    panel(1, 'Telemetría de cabina <span class="livetag label">en vivo · simulado</span>', `<div class="ros">${items.map(([k, n, v, u, r]) => readout({n, val: v, u, s: R[k](sh[k]), src: 'Sensor', r}, shipH[k])).join('')}${readout({n: 'Radiación', val: FV.envOf().rad.replace('≈ ', ''), u: '', s: 'i', src: 'Dosímetro', r: 'según entorno'})}</div>`) +
    panel(2, 'Simulación de falla', `<p class="note">Probá cómo reacciona FAVALORO: el CO₂ sube, el asesor avisa y el parte del comandante suma una recomendación.</p><button type="button" class="btn-line label" id="co2Fail" data-focus="co2">${fail ? 'Reparar depurador de CO₂' : 'Simular falla del depurador de CO₂'}</button>`);
};
/* Soporte vital (ECLSS): ambiente, microbios y biomarcadores cruzados por el motor de correlación del equipo. */
VIEWS['esp:eclss'] = () => {
  const e = FV.eclss(), al = (FV.state.eclssAlerts || []).slice().reverse().slice(0, 6), crisis = e.amb.co2_ppm > 4000;
  const f = (n, v, u, s, r) => readout({n, val: v, u, s, src: 'Sensor', r});
  return hello('Soporte vital (ECLSS)', 'Aire, agua y defensas, cruzados.', 'El motor de correlación cruza el ambiente, los microbios del agua y los biomarcadores de la tripulación. Si coinciden, abre una alerta con su protocolo paso a paso.') +
    `<div class="row-btns" style="margin:0 0 20px"><button type="button" class="btn${crisis ? '-line' : ''} label" data-crisis="${crisis ? 'off' : 'on'}">${crisis ? 'Restaurar valores normales' : 'Simular crisis'}</button><span class="label dim">Umbrales de ejemplo del hackatón, no normativos</span></div>` +
    panel(1, 'Ambiente del hábitat', `<div class="ros">${f('CO₂', e.amb.co2_ppm, 'ppm', e.amb.co2_ppm > 4000 ? 2 : e.amb.co2_ppm > 2000 ? 1 : 0, 'menos de 2000 · crítico > 4000')}${f('Ruido', e.amb.ruido_db, 'dB', e.amb.ruido_db > 68 ? 2 : e.amb.ruido_db > 60 ? 1 : 0, 'menos de 60 · crítico > 68')}${f('Luz', e.amb.luz_lux, 'lux', e.amb.fase_circadiana === 'NOCHE' && e.amb.luz_lux > 50 ? 2 : 0, e.amb.fase_circadiana === 'NOCHE' ? 'noche: menos de 10' : 'día: ≈ 500')}${f('Compuestos volátiles', e.amb.voc_ppb, 'ppb', e.amb.voc_ppb > 250 ? 1 : 0, 'menos de 250')}${f('Oxígeno', e.amb.o2_porcentaje, '%', e.amb.o2_porcentaje < 19.5 || e.amb.o2_porcentaje > 23.5 ? 1 : 0, '19,5–23,5 %')}${f('Temperatura', e.amb.temperatura_c, '°C', e.amb.temperatura_c > 23.9 || e.amb.temperatura_c < 18.3 ? 1 : 0, '18,3–23,9 °C')}</div>`) +
    `<div class="cols c-2">${panel(2, 'Agua potable · microbiología', `<dl class="facts"><div><dt class="label">Bacterias</dt><dd style="color:${FV.color(e.micro.bacterias_ufc > 100 ? 2 : 0)}">${e.micro.bacterias_ufc} UFC/mL</dd></div><div><dt class="label">Hongos</dt><dd style="color:${FV.color(e.micro.hongos_ufc > 100 ? 2 : 0)}">${e.micro.hongos_ufc} UFC</dd></div><div><dt class="label">Patógeno</dt><dd>${esc(e.micro.patogeno_detectado)}</dd></div></dl><p class="note">${esc(e.micro.ubicacion)} · normal menos de 50, crítico más de 100.</p>`)}
    ${panel(3, 'Biomarcadores de la tripulación', `<div class="wx"><table><thead><tr><th>Tripulante</th><th>Cortisol</th><th>sIgA</th><th>IL-6</th><th>Virus EBV</th></tr></thead><tbody>${e.bio.map((b) => `<tr><td><b>${crew(b.uid).name}</b></td><td style="color:${b.cortisol_nmol > 22 ? 'var(--bad)' : 'inherit'}">${b.cortisol_nmol} nmol/L</td><td style="color:${b.siga_ug_ml < 60 ? 'var(--bad)' : 'inherit'}">${b.siga_ug_ml} µg/mL</td><td style="color:${b.il6_pg_ml > 5 ? 'var(--bad)' : 'inherit'}">${b.il6_pg_ml} pg/mL</td><td style="color:${b.carga_viral_ebv > 10000 ? 'var(--bad)' : 'inherit'}">${b.carga_viral_ebv.toLocaleString('es-AR')}</td></tr>`).join('')}</tbody></table></div><p class="note">Cortisol 2–18 · sIgA más de 100 · IL-6 bajo · EBV bajo (copias/mL en saliva).</p>`)}</div>` +
    panel(4, 'Alertas del motor de correlación', al.length ? al.map((a) => `<section class="eca" style="--c:${FV.color(a.estado === 'ACTIVA' ? Math.min(a.lvl, 3) : 0)}"><div class="eca-h">${st(a.estado === 'ACTIVA' ? Math.min(a.lvl, 3) : 0, a.estado === 'ACTIVA' ? (a.lvl >= 3 ? 'Crítica' : 'Advertencia') : 'Resuelta')}<b>${esc(a.t)}</b></div><p class="note">${esc(a.dx)}</p><ol class="eca-steps">${a.pasos.map((p) => `<li><button type="button" class="${p.completado ? 'done' : ''}" data-step="${a.id}" data-orden="${p.orden}" aria-pressed="${p.completado}" data-focus="s${a.id}${p.orden}"><span class="ck" aria-hidden="true">${p.completado ? '✓' : ''}</span>${esc(p.accion)}</button></li>`).join('')}</ol></section>`).join('') : '<p class="note">Sin alertas. Probá «Simular crisis» para ver cómo el motor cruza los datos.</p>');
};
/* Monitor de radiación solar: tasa de dosis y acumulado contra sus referencias, en 4 niveles. */
let radSel = 'spe';
VIEWS['esp:rad'] = () => {
  const R = FV.RAD, s = R.escenarios.find((x) => x.k === radSel) || R.escenarios[0];
  const fT = s.tasaMax / R.umbral, nT = FV.radLevel(fT), fA = s.acum === null ? 0 : s.acum / R.limite;
  const lvlC = (n) => ['var(--ok)', 'var(--warn)', 'var(--org)', 'var(--bad)'][n];
  const G = FV.radSeries(s.k), Lh = FV.radLET(s.k);
  const hist = G.peor.nivel > G.ultima.nivel ? `<p class="note"><b>Antes se llegó a nivel ${R.nombres[G.peor.nivel]} (ventana ${G.peor.ventana}):</b> revisar el historial en el gráfico de tasa.</p>` : '';
  return hello('Monitor de radiación solar', 'Partícula por partícula.', 'El detector de silicio cuenta cada partícula, calcula la dosis equivalente con el factor de calidad de la ICRP 60 y la compara con una tasa de referencia de 1500 µSv/día y un acumulado de 50 mSv (valores de ejemplo).') +
    `<div class="env-pick" role="radiogroup" aria-label="Escenario">${R.escenarios.map((x) => `<button type="button" role="radio" aria-checked="${x.k === radSel}" data-rad="${x.k}" data-focus="r${x.k}"><b>${x.n}</b><small>${x.eventos.toLocaleString('es-AR')} partículas</small></button>`).join('')}</div>` +
    `<div class="cols c-2">${panel(1, 'Estado', `<p class="state-big" style="color:${lvlC(s.nivel)}">${R.nombres[s.nivel]}</p><dl class="facts"><div><dt class="label">Tasa máxima</dt><dd style="color:${lvlC(nT)}">${s.tasaMax.toLocaleString('es-AR')} µSv/día</dd></div><div><dt class="label">De la referencia</dt><dd>${Math.round(fT * 100)} %</dd></div><div><dt class="label">Acumulado</dt><dd>${s.acum === null ? 'bajo' : s.acum.toFixed(3).replace('.', ',') + ' mSv'}</dd></div><div><dt class="label">Del límite</dt><dd>${s.acum === null ? '< 1 %' : (fA * 100).toFixed(1).replace('.', ',') + ' %'}</dd></div></dl>${s.nota ? `<p class="note">${s.nota}</p>` : ''}<p class="note">Niveles por fracción de la referencia: menos de 25 % normal · 25–60 % precaución · 60–100 % alerta · desde 100 % crítico.</p>`)}
    ${panel(2, 'Qué hacer', `<ul class="why">${R.pasos[s.nivel].map((p) => `<li>${p}</li>`).join('')}${fT >= 1 ? '<li><b>Tasa por encima de la referencia:</b> refugiarse hasta que la tasa vuelva a niveles normales.</li>' : ''}</ul>${hist}<p class="note">Recomendaciones del módulo de radiación del equipo, por nivel.</p>`)}</div>` +
    panel(3, 'Tasa de dosis por ventana', radRate(G) + `<p class="note">Cada barra es una ventana de 10 minutos, pintada con su nivel. Pico: ${G.pico.tasa.toLocaleString('es-AR')} µSv/día en la ventana ${G.pico.ventana}. La línea marca la referencia de 1500 µSv/día.</p>`) +
    `<div class="cols c-2">${panel(4, 'Dosis acumulada', radAcum(G))}${panel(5, 'Energía de las partículas (LET)', radLetChart(Lh))}</div>`;
};
/* ---- gráficos de radiación (SVG, mismo estilo HUD que el resto) ---- */
const LV = ['var(--ok)', 'var(--warn)', 'var(--org)', 'var(--bad)'];
const mono = 'font-family="IBM Plex Mono" font-size="9" style="fill:var(--none)"';
const nf = (v, d = 0) => v.toLocaleString('es-AR', {minimumFractionDigits: d, maximumFractionDigits: d});
function radRate(G) {
  const R = FV.RAD, n = G.pts.length, W = 640, H = 220, L = 46, Rr = 12, T = 12, B = 30, pw = W - L - Rr, ph2 = H - T - B;
  const top = Math.max(G.s.tasaMax, R.umbral) * 1.12, Y = (v) => T + ph2 * (1 - v / top), bw = pw / n;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tasa de dosis por ventana de 10 minutos">`;
  // franjas de nivel: 25 %, 60 % y 100 % de la referencia
  [[0, .25], [.25, .6], [.6, 1], [1, top / R.umbral]].forEach(([a, b], i) => { s += `<rect x="${L}" width="${pw}" y="${Y(b * R.umbral)}" height="${Math.max(0, Y(a * R.umbral) - Y(b * R.umbral))}" style="fill:${LV[i]};opacity:.06"/>`; });
  [0, .5, 1].forEach((f) => { const v = Math.round(top * f / 100) * 100; s += `<text x="${L - 8}" y="${Y(v) + 3}" text-anchor="end" ${mono}>${nf(v)}</text>`; });
  G.pts.forEach((p, i) => { const y = Y(p.tasa); s += `<rect x="${L + i * bw + bw * .18}" y="${y}" width="${bw * .64}" height="${Y(0) - y}" style="fill:${LV[p.nTasa]}"><title>Ventana ${p.ventana} · ${nf(p.tasa)} µSv/día · ${R.nombres[p.nTasa]}</title></rect>`; });
  s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(R.umbral)}" y2="${Y(R.umbral)}" style="stroke:var(--bad)" stroke-dasharray="4 4"/><text x="${W - Rr}" y="${Y(R.umbral) - 5}" text-anchor="end" ${mono} letter-spacing="1">REFERENCIA 1500</text>`;
  s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(0)}" y2="${Y(0)}" style="stroke:rgb(var(--fg-rgb) / .2)"/>`;
  const step = Math.ceil(n / 9);
  G.pts.forEach((p, i) => { if (i % step === 0 || i === n - 1) s += `<text x="${L + i * bw + bw / 2}" y="${H - 12}" text-anchor="middle" ${mono}>${p.ventana}</text>`; });
  s += `<text x="${L}" y="${H - 1}" ${mono}>VENTANA (10 MIN) · µSv/DÍA</text>`;
  return s + '</svg>' + `<div class="legend">${R.nombres.map((x, i) => `<span class="label"><i style="background:${LV[i]}"></i>${x}</span>`).join('')}</div>`;
}
function radAcum(G) {
  const R = FV.RAD, n = G.pts.length, W = 420, H = 200, L = 52, Rr = 12, T = 12, B = 30, pw = W - L - Rr, ph2 = H - T - B;
  const mx = G.ultima.acum, top = mx > 0 ? mx * 1.15 : 0.001;
  const X = (i) => L + (n < 2 ? pw / 2 : i * pw / (n - 1)), Y = (v) => T + ph2 * (1 - v / top);
  const pts = G.pts.map((p, i) => X(i) + ',' + Y(p.acum)).join(' ');
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dosis acumulada por ventana">`;
  [0, .5, 1].forEach((f) => { s += `<text x="${L - 8}" y="${Y(top * f) + 3}" text-anchor="end" ${mono}>${nf(top * f, 3)}</text>`; if (f) s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(top * f)}" y2="${Y(top * f)}" style="stroke:rgb(var(--fg-rgb) / .1)" stroke-dasharray="2 5"/>`; });
  s += `<polygon points="${X(0)},${Y(0)} ${pts} ${X(n - 1)},${Y(0)}" style="fill:var(--earth);opacity:.14"/><polyline fill="none" style="stroke:var(--earth)" stroke-width="1.6" stroke-linejoin="round" points="${pts}"/>`;
  s += `<circle cx="${X(n - 1)}" cy="${Y(mx)}" r="3" style="fill:var(--earth)"><title>Final · ${nf(mx, 3)} mSv</title></circle>`;
  s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(0)}" y2="${Y(0)}" style="stroke:rgb(var(--fg-rgb) / .2)"/>`;
  [0, n - 1].forEach((i) => { s += `<text x="${X(i)}" y="${H - 12}" text-anchor="${i ? 'end' : 'start'}" ${mono}>${i ? nf(n * R.ventanaS / 3600, 1) + ' h' : '0 h'}</text>`; });
  s += `<text x="${L}" y="${H - 1}" ${mono}>mSv</text></svg>`;
  const pct = mx / R.limite * 100;
  return s + `<div class="dosebar" aria-hidden="true"><i style="width:${Math.max(0.6, Math.min(100, pct))}%;background:${LV[FV.radLevel(mx / R.limite)]}"></i></div><p class="note">Final: ${nf(mx, 3)} mSv = ${pct < 0.1 ? 'menos de 0,1' : nf(pct, 1)} % del límite de ${R.limite} mSv (la barra). El límite queda fuera de la escala del gráfico porque está muy lejos.</p>`;
}
function radLetChart(Lh) {
  const W = 420, H = 200, L = 40, Rr = 12, T = 12, B = 30, pw = W - L - Rr, ph2 = H - T - B, n = Lh.cuentas.length, bw = pw / n;
  const mx = Math.max(...Lh.cuentas, 1), lg = (v) => (v > 0 ? Math.log10(v + 1) / Math.log10(mx + 1) : 0);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Histograma de LET en agua">`;
  [1, 10, 100, 1000, 10000, 100000].filter((v) => v <= mx * 1.2).forEach((v) => { const y = T + ph2 * (1 - lg(v)); s += `<line x1="${L}" x2="${W - Rr}" y1="${y}" y2="${y}" style="stroke:rgb(var(--fg-rgb) / .08)"/><text x="${L - 6}" y="${y + 3}" text-anchor="end" ${mono}>${v >= 1000 ? v / 1000 + 'k' : v}</text>`; });
  Lh.cuentas.forEach((c, i) => { const h = ph2 * lg(c), hiQ = Lh.bordes[i] >= 10; s += `<rect x="${L + i * bw + bw * .14}" y="${T + ph2 - h}" width="${bw * .72}" height="${h}" style="fill:${hiQ ? 'var(--org)' : 'var(--earth)'}"><title>${Lh.bordes[i]}–${Lh.bordes[i + 1]} keV/µm · ${nf(c)} partículas</title></rect><text x="${L + i * bw + bw / 2}" y="${H - 12}" text-anchor="middle" ${mono}>${Lh.bordes[i]}</text>`; });
  s += `<line x1="${L}" x2="${W - Rr}" y1="${T + ph2}" y2="${T + ph2}" style="stroke:rgb(var(--fg-rgb) / .2)"/><text x="${L}" y="${H - 1}" ${mono}>LET EN AGUA · keV/µm (ESCALA LOG)</text></svg>`;
  return s + `<div class="legend"><span class="label"><i style="background:var(--earth)"></i>Q = 1</span><span class="label"><i style="background:var(--org)"></i>Q mayor a 1 (desde 10 keV/µm)</span></div><p class="note">Casi todas las partículas son ligeras y quedan abajo de 1 keV/µm. Los iones pesados son el 3 % de las partículas pero aportan el ${nf(Lh.aportePesados * 100)} % de la dosis equivalente. Factor de calidad medio: ${nf(Lh.qMedio, 2)}.</p>`;
}
/* ---------- Protocolos que vigila el asistente ---------- */
const protoFor = (list) => (session && session.role === 'crew' ? list.filter((p) => p.who === 'Toda la tripulación' || p.who === crew(session.uid).name) : list);
// A un tripulante no se le muestran los datos de salud de otro compañero.
const protoWhy = (p) => (p.whyPublic && session && session.role === 'crew' && session.uid !== p.subject ? p.whyPublic : p.why);
function protoCards(list) {
  return list.map((p) => {
    const lv = Math.min(p.lvl, 3), nx = p.steps.findIndex((s) => !s.done), dn = p.steps.filter((s) => s.done).length;
    return `<section class="eca" style="--c:${FV.color(lv >= 3 ? 2 : lv)}"><div class="eca-h">${st(lv >= 3 ? 2 : lv, ['Atención', 'Atención', 'Advertencia', 'Crítico'][lv])}<b>${esc(p.t)}</b><span class="label dim">${esc(p.area)} · ${dn}/${p.steps.length}</span></div>
      <p class="note">${esc(protoWhy(p))} <b>Para:</b> ${esc(p.who)}.${p.esc ? ' <b class="c-bad">Escalado: el asistente avisó al Comandante y al oficial médico.</b>' : ''}</p>
      <ol class="eca-steps">${p.steps.map((s, i) => `<li><button type="button" class="${s.done ? 'done' : ''}${i === nx ? ' next' : ''}" data-pstep="${esc(p.id)}" data-i="${i}" aria-pressed="${s.done}" data-focus="ps${esc(p.id)}${i}"><span class="ck" aria-hidden="true">${s.done ? '✓' : ''}</span>${esc(s.t)}</button></li>`).join('')}</ol>
      ${nx >= 0 ? `<div class="row-btns"><button type="button" class="btn-line label" data-pguide="${esc(p.id)}">Guiame por voz →</button></div>` : '<p class="note c-ok">Todos los pasos hechos.</p>'}</section>`;
  }).join('');
}
function protoPanel(i) {
  const list = protoFor(FV.protocols());
  return panel(i, `Vigilancia del asistente <span class="livetag label">${list.length ? list.length + ' protocolo' + (list.length > 1 ? 's' : '') + ' activo' + (list.length > 1 ? 's' : '') : 'todo en orden'}</span>`,
    `<p class="note">El asistente revisa cada pocos segundos la nave, la radiación y los signos de cada tripulante. Si algo se sale de rango, abre el protocolo, avisa en voz alta y guía paso a paso. Si un protocolo crítico no avanza en 90 segundos, avisa al Comandante y al oficial médico, y llama al tripulante.</p>` +
    (list.length ? protoCards(list) : '<p class="state-big" style="color:var(--ok)">Sin protocolos activos</p>') +
    (session.role !== 'crew' ? `<div class="row-btns"><span class="label dim">Probar el peor escenario:</span><button type="button" class="btn-line label" data-storm data-focus="storm">${S().radStorm ? 'Terminar tormenta solar' : 'Tormenta solar'}</button><button type="button" class="btn-line label" id="co2Fail" data-focus="co2">${S().co2Target > 3.5 ? 'Reparar depurador de CO₂' : 'Falla del depurador de CO₂'}</button><button type="button" class="btn-line label" data-crisis="${FV.eclssActive().length ? 'off' : 'on'}" data-focus="crisis">${FV.eclssActive().length ? 'Resolver crisis ECLSS' : 'Crisis de soporte vital'}</button><button type="button" class="btn-line label" data-simfever data-focus="fever">Hipoxia en Astronauta 2</button></div>` : ''));
}
VIEWS['esp:risk'] = () => hello('Riesgos de la tripulación', 'Los 5 peligros del vuelo espacial, hoy.', 'Según el entorno, la nave y los datos de salud. Basado en los peligros que estudia el Programa de Investigación Humana de la NASA.') + protoPanel(0) +
  `<div class="risks">${FV.risks().map((r, i) => `<section class="panel hud risk"><header class="ph"><span class="label">${pad(i + 1)}</span><h3>${r.h}</h3>${st(r.l, ['Riesgo bajo', 'Riesgo medio', 'Riesgo alto'][r.l])}</header><dl class="kv"><div><dt class="label">Por qué</dt><dd>${r.why}</dd></div><div><dt class="label">Qué puede causar</dt><dd>${r.eff}</dd></div><div><dt class="label">A quién afecta</dt><dd>${r.who}</dd></div><div><dt class="label">Cómo se mitiga</dt><dd>${r.mit}</dd></div></dl></section>`).join('')}</div>` +
  panel(6, 'Exposición por tripulante', `<div class="wx"><table><thead><tr><th>Tripulante</th><th>Radiación hoy</th><th>Dosis de carrera</th><th>Actividad</th><th>Sueño</th><th>Mente</th></tr></thead><tbody>${FV.CREW.map((m) => { const I = FV.ind(m.id), c = FV.lastCheck(m.id); return `<tr><td><b>${m.name}</b></td><td>${I.dose.val} mGy</td><td>${st(I.career.s, I.career.val + ' / 600 mSv')}<div class="dosebar"><i style="width:${Math.min(100, I.career.val / 6)}%;background:${FV.color(I.career.s)}"></i></div></td><td>${st(I.act.s, I.act.val + ' min')}</td><td>${st(I.sleep.s, I.sleep.val + ' h')}</td><td>${c ? st(c.s, FV.STATE[c.s]) : st(null)}</td></tr>`; }).join('')}</tbody></table></div><p class="note">Límite de carrera: menos de 600 mSv por tripulante (NASA-STD-3001 Vol. 1, V1 4030). Dosis previa simulada + ${FV.NASA.missionDay} días de misión en ${FV.envOf().n}.</p>`) + nasaSources(7);
function nasaSources(i) {
  return panel(i, 'Fuentes NASA y agencias asociadas', `<ol class="log">${FV.NASA.sources.map((s) => `<li><span class="label c-earth">${s.csa ? 'CSA' : 'NASA'}</span><a class="src-link" href="${s.u}" target="_blank" rel="noopener">${esc(s.t)} ↗</a></li>`).join('')}</ol><p class="note">Los límites, reglas y planes de la app salen de estos documentos. Los datos de la tripulación son simulados.</p>`);
}

/* ---------------- OFICIAL MÉDICO ---------------- */
const medPick = () => `<div class="pick" role="radiogroup" aria-label="Tripulante">${FV.CREW.map((m) => `<button type="button" role="radio" aria-checked="${medSel === m.id}" data-med="${m.id}" data-focus="mp${m.id}" style="--c:${FV.color(FV.combined(m.id).s)}"><i></i>${m.name}</button>`).join('')}</div>`;
VIEWS['med:crew'] = () => hello('Vista médica', 'Tripulación completa.') +
  `<div class="crows">${FV.CREW.map((m) => crewRow(m, 'med')).join('')}</div>` +
  panel(1, 'Signos vitales <span class="livetag label">en vivo · simulado</span>', `<div class="wx"><table><thead><tr><th>Tripulante</th><th>Pulso</th><th>SpO₂</th><th>Temp.</th><th>Resp.</th><th>Presión</th><th>Glucosa</th><th>Reacción</th></tr></thead><tbody>${FV.CREW.map((m) => { const I = FV.ind(m.id); return `<tr><td><b>${m.name}</b></td>${['hr', 'spo2', 'temp', 'rr', 'bp', 'glu', 'react'].map((k) => `<td style="color:${I[k].s === 0 ? 'inherit' : FV.color(I[k].s)}">${I[k].val} <small class="dim">${I[k].u}</small></td>`).join('')}</tr>`; }).join('')}</tbody></table></div>`);
VIEWS['med:ficha'] = () => {
  const id = medSel, I = FV.ind(id), v = FV.live[id], c = FV.combined(id);
  return hello('Ficha clínica', crew(id).name + ' · ' + FV.label(c.s) + '.') + medPick() +
    panel(1, 'Signos vitales · brazalete', `<div class="ros">${['hr', 'spo2', 'temp', 'rr'].map((k) => readout(I[k], v.h[k])).join('')}</div>`) +
    panel(2, 'Sistemas del cuerpo', `<div class="wx"><table><thead><tr><th>Sistema</th><th>Estado</th><th>Indicadores</th><th>Dato médico NASA</th><th>Riesgo NASA</th></tr></thead><tbody>${FV.ZONES.map((z) => { const s = z.k.length ? FV.worst(z.k.map((k) => I[k].s)) : null; return `<tr><td><b>${z.t}</b></td><td>${st(z.z === 'rad' ? 'i' : s, z.k.length ? null : 'Requiere examen')}</td><td>${z.k.map((k) => `${I[k].n}: <b style="color:${I[k].s ? FV.color(I[k].s) : 'var(--fg)'}">${I[k].val} ${I[k].u}</b> <small class="dim rng">${I[k].r}</small>`).join('<br>') || '—'}</td><td class="trace">${z.k.map((k) => FV.NASA.trace[k]).filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join('<br>') || (z.z === 'eyes' ? 'Ophthalmology Examination (MEDB 1.10, MR014)' : '—')}</td><td>${z.risk}</td></tr>`; }).join('')}</tbody></table></div><p class="note">Cada medición corresponde a una categoría del catálogo «Medical Data Available for Request» de la NASA: así los datos de FAVALORO se pueden comparar con los registros oficiales.</p>`) +
    panel(3, 'Sugerencias para el oficial médico', `<ul class="why">${medSuggest(id).map((x) => `<li>${x}</li>`).join('') || '<li>Sin hallazgos fuera de rango.</li>'}</ul><p class="note">Orientativas, a criterio del médico. Verificar contra los protocolos de la misión.</p>`) +
    ewsPanel(id, 4) + fitPanel(id, 5) + testsSummary(id, 6) + sleepPanel(id, 7, true);
};
// Resumen de tests y ruido para el médico, comparado con la base de cada uno.
function testsSummary(id, i) {
  const L = (k) => FV.lastTest(id, k), F = (k) => FV.testsOf(id, k)[0], N = FV.noiseDay(id);
  const row = (n, t, base, s) => `<tr><td>${n}</td><td>${t ? esc(t) : '—'}</td><td>${base || '—'}</td><td>${s === null ? st(null) : st(s)}</td></tr>`;
  const v = L('vis'), m = L('mem'), a = L('att'), au = L('aud');
  return panel(i, 'Tests y ruido', `<div class="wx"><table><thead><tr><th>Test</th><th>Último</th><th>Su base</th><th>Estado</th></tr></thead><tbody>
    ${row('Vista (SANS)', v && v.detail + ' · ' + FV.fmt(v.ts), F('vis') && F('vis').detail, v ? v.s : null)}
    ${row('Memoria', m && m.score + ' números', F('mem') && F('mem').score + ' números', m ? m.s : null)}
    ${row('Atención', a && a.score + ' % · ' + a.ms + ' ms', F('att') && F('att').score + ' %', a ? a.s : null)}
    ${row('Audición', au && au.detail, '', au ? au.s : null)}
    ${row('Ruido de hoy', Math.round(N.leq) + ' dBA · protectores ' + N.prot + ' h', 'límite ' + FV.NOISE_LIM + ' dBA', N.s)}
  </tbody></table></div><p class="note">Los tests los hace el tripulante desde su pestaña «Tests». Se comparan con sus propios resultados de la primera semana.</p>`);
}
VIEWS['med:mente'] = () => {
  const id = medSel, d = daily(id), days = Object.keys(d).sort(), last = FV.lastCheck(id);
  const ser = [{name: 'Malestar', color: PAL[0], k: null}, {name: 'Sueño', color: PAL[1], k: 'sleep'}, {name: 'Ánimo', color: PAL[2], k: 'mood'}, {name: 'Ansiedad', color: PAL[3], k: 'anx'}, {name: 'Estrés', color: PAL[4], k: 'str'}]
    .map((x) => ({...x, pts: days.map((y, i) => ({i, v: Math.round(x.k ? d[y].ds[x.k] : d[y].idx)})).filter((p) => !isNaN(p.v))}));
  return hello('Mente y estrés', crew(id).name + '.') + medPick() + `<div class="cols c-2">
    ${panel(1, 'Último chequeo', last ? meter(last.idx, last.s) + `<p class="note">${FV.fmt(last.ts)}</p>` + domains(last.ds) : '<p class="note">Sin chequeos.</p>')}
    ${panel(2, 'Lectura clínica', `<ul class="why">${last ? [last.ds.sleep > 45 ? 'Sueño en alerta (' + Math.round(last.ds.sleep) + '/100): evaluar insomnio y ritmo circadiano.' : null, last.ds.mood > 45 ? 'Ánimo en alerta: tamizaje de depresión (PHQ-9).' : null, last.ds.anx > 45 ? 'Ansiedad elevada: evaluar con GAD-7 y revisar la carga de trabajo.' : null, last.ds.str > 45 ? 'Estrés y convivencia alterados: mediación y rotación de tareas.' : null].filter(Boolean).map((x) => `<li>${x}</li>`).join('') || '<li>Sin dominios en alerta.</li>' : '<li>Sin datos.</li>'}</ul>`)}
  </div>` + panel(3, 'Evolución por dominio', days.length ? chart(ser, days, 240) : '<p class="note">Sin datos.</p>');
};
VIEWS['med:nutri'] = () => {
  const id = medSel, n = FV.nsum(id), I = FV.ind(id);
  return hello('Nutrición', crew(id).name + '.') + medPick() + `<div class="cols c-2">
    ${panel(1, 'Señales', st(n.s) + (n.sig.length ? '<ul class="why">' + n.sig.map((x) => `<li>${x.x}</li>`).join('') + '</ul>' : '<p class="note">Sin señales.</p>') + '<p class="label sub">Ingesta · 14 días</p>' + strip14(id))}
    ${panel(2, 'Masa e hidratación', `<dl class="facts">${[['Base', n.m.length ? FV.f1(n.m[0].kg) + ' kg' : '—'], ['Última', n.m.length ? FV.f1(n.m[n.m.length - 1].kg) + ' kg' : '—'], ['Cambio', n.pct === null ? '—' : (n.pct > 0 ? '+' : '') + FV.f1(n.pct) + ' %'], ['Agua hoy', I.water.val + ' vasos'], ['Glucosa', I.glu.val + ' mg/dL']].map(([k, v]) => `<div><dt class="label">${k}</dt><dd>${v}</dd></div>`).join('')}</dl><p class="note">Pérdida ≥2 %: vigilar · ≥5 %: alerta (umbrales provisorios). Vitaminas, hierro y hueso solo con laboratorio y DXA antes y después del vuelo.</p>`)}
  </div>`;
};
VIEWS['med:plan'] = () => {
  const day = FV.NASA.missionDay;
  const flight = FV.NASA.plan.filter((p) => !p.post), post = FV.NASA.plan.filter((p) => p.post);
  const massTxt = FV.CREW.map((m) => { const n = FV.nsum(m.id); return m.name + ': ' + (n.massDays === null ? 'sin dato' : 'hace ' + n.massDays + ' d'); }).join(' · ');
  const stOf = (p) => (p.fd === null ? (p.t.startsWith('Masa') ? st(FV.CREW.some((m) => (FV.nsum(m.id).massDays ?? 99) > 30) ? 1 : 0, massTxt) : st(0, 'En curso')) : p.fd <= day ? st(0, 'Hecho · FD ' + p.fd) : st(1, 'Próximo · FD ' + p.fd + ' (faltan ' + (p.fd - day) + ' d)'));
  const rows = (list, post) => `<ol class="log plan">${list.map((p) => `<li><span class="label c-earth">${p.when}</span><span><b>${p.t}</b><br><small class="dim">${p.src}</small></span>${post ? st(null, 'Después del aterrizaje') : stOf(p)}</li>`).join('')}</ol>`;
  return hello('Plan de evaluaciones NASA', 'Qué hay que medir y cuándo.', `Basado en los documentos médicos de la NASA (MEDB, JSC 28913) que resumieron las planillas de nutrición y neurología del equipo. Hoy es el día de vuelo ${day}.`) +
    panel(1, 'Durante el vuelo', rows(flight, false)) +
    panel(2, 'Después del aterrizaje', rows(post, true)) +
    panel(3, 'Reglas que aplica FAVALORO', `<ul class="why"><li><b>R06 · FFQ semanal:</b> recordatorio si pasan más de 7 días sin el cuestionario de alimentación.</li><li><b>R07 · Masa corporal:</b> aviso si pasan más de 30 días sin medirla (se ve en Nutrición y en Alertas).</li><li><b>R14 · Privacidad:</b> los datos se comparten solo con consentimiento del tripulante; el comandante ve estados, no respuestas.</li><li><b>Audición en órbita (MEDB 1.8):</b> si el umbral cambia frente a la línea base, se deriva al tripulante a acción correctiva.</li><li><b>Equilibrio después del vuelo (MEDB 1.5):</b> con 2 caídas en una prueba, se suspende; el cirujano de vuelo decide el regreso a las actividades.</li></ul>`) +
    nasaSources(4);
};
function clinicalAlerts() {
  const out = [];
  FV.CREW.forEach((m) => {
    const I = FV.ind(m.id), c = FV.combined(m.id);
    Object.values(I).forEach((x) => { if (x.s === 1 || x.s === 2) out.push({s: x.s, who: m.name, t: `${x.n}: ${x.val} ${x.u}`, r: x.r}); });
    if (c.c && c.c.s >= 2) out.push({s: c.c.s, who: m.name, t: 'Mente: ' + FV.STATE[c.c.s] + ' (malestar ' + c.c.idx + ')', r: 'chequeo diario'});
    c.n.sig.forEach((x) => out.push({s: x.l, who: m.name, t: x.x, r: 'nutrición'}));
  });
  return out.sort((a, b) => b.s - a.s);
}
// Pedidos de charla con el psicólogo: el médico ve quién y cuándo, nunca el diario ni el motivo.
const ppcPanel = () => { const l = (S().ppc || []).filter((p) => Date.now() - p.ts < 864e5 * 14).slice().reverse(); return l.length ? panel(9, 'Pedidos de charla con el psicólogo', `<ul class="adv-r">${l.map((p) => `<li><b>${crew(p.uid).name}</b> pidió una conferencia psicológica privada (${FV.fmt(p.ts)}): agendarla en la próxima ventana de comunicación.</li>`).join('')}</ul><p class="note">Por privacidad no se muestra el motivo ni el contenido del diario.</p>`) : ''; };
VIEWS['med:alert'] = () => { const out = clinicalAlerts(); return hello('Alertas clínicas', out.length + ' activa' + (out.length === 1 ? '' : 's') + '.') + protoPanel(0) + ppcPanel() + `<ol class="alerts">${out.map((x, i) => `<li><span class="label">${pad(i + 1)}</span>${st(Math.min(x.s, 3))}<div><b>${x.who}</b><p>${x.t} <span class="dim">· rango ${x.r}</span></p></div></li>`).join('') || '<li>Sin alertas.</li>'}</ol>` + nasaSources(2); };

/* Sugerencias médicas por reglas (sin dosis: eso lo decide el médico). */
function medSuggest(id) {
  const I = FV.ind(id), c = FV.combined(id), out = [];
  if (I.spo2.s >= 1) out.push(`SpO₂ ${I.spo2.val} %: verificar el sensor y repetir en reposo. Si se sostiene por debajo de 92 %, evaluar hipoxia, revisar O₂ y presión de cabina.`);
  if (I.temp.s >= 1) out.push(`Temperatura ${I.temp.val} °C: control cada 4 h, hidratación y buscar foco infeccioso. Considerar aislamiento si hay síntomas respiratorios.`);
  if (I.hr.s >= 1) out.push(`Pulso ${I.hr.val} lpm en reposo: correlacionar con estrés, fiebre y deshidratación; ECG si se acompaña de dolor de pecho o palpitaciones.`);
  if (I.bp.s >= 1) out.push(`Presión ${I.bp.val} mmHg: repetir la toma, revisar sodio y estrés; seguimiento diario.`);
  if (I.glu.s >= 1) out.push(`Glucosa ${I.glu.val} mg/dL: confirmar en ayunas y revisar ingesta y actividad.`);
  if (I.sleep.s >= 1) out.push(`Sueño ${I.sleep.val} h con ${I.wake.val} despertares: higiene del sueño, revisar luz y ruido del módulo y el turno asignado.`);
  if (I.react.s >= 1) out.push(`Reacción ${I.react.val} ms: posible fatiga. No asignar maniobras ni EVA hasta repetir el test.`);
  if (c.c && c.c.s >= 2) out.push('Chequeo de mente en alerta: entrevista hoy, tamizaje PHQ-9 y GAD-7, y conferencia con apoyo psicológico.');
  if (c.n.wl) out.push(`Pérdida de peso ${FV.f1(c.n.pct)} %: evaluación nutricional, aumentar aporte calórico y proteico, control semanal.`);
  if (c.n.il) out.push('Ingesta baja sostenida: revisar apetito, náuseas y ánimo; comidas pequeñas y frecuentes.');
  return out;
}

/* ======================================================================
   ASESOR
   ====================================================================== */
const advLog = [];
/* Mensajes que el asistente inicia solo (cambio en los signos, chequeo diario). */
const pro = [];
/* Mensaje que el asistente inicia solo. Con nivel (1 a 3) es una alerta: suena y se dice en voz alta. */
function proactive(t, opts, lvl) {
  pro.unshift({id: FV.nid(), ts: Date.now(), t, opts, done: null, lvl: lvl || 0});
  if (pro.length > 6) pro.pop();
  advTab = 'chat';
  if ($('#adv').hidden) openAdv(); else renderAdv();
  if (!window.FVLive) return;
  if (lvl) FVLive.announce(t, lvl); else FVLive.speak(t);
}
function advData() {
  const r = session.role, A = [], R = [];
  protoFor(FV.protocols()).forEach((p) => { const nx = p.steps.find((s) => !s.done); A.push({s: Math.min(p.lvl, 3), t: 'Protocolo · ' + p.t + (nx ? '. Próximo paso: ' + nx.t : '. Pasos completos.'), guide: nx ? p.id : null}); });
  if (r === 'crew') {
    const id = session.uid, I = FV.ind(id), c = FV.combined(id);
    Object.values(I).forEach((x) => { if (x.s === 1 || x.s === 2) A.push({s: x.s, t: `${x.n}: ${x.val} ${x.u} (rango ${x.r})`}); });
    if (c.c && c.c.s >= 2) A.push({s: c.c.s, t: 'Tu último chequeo de mente salió en ' + FV.STATE[c.c.s].toLowerCase() + '.'});
    if (I.sleep.s >= 1) R.push('Dormiste ' + I.sleep.val + ' h: esta noche bajá luces y pantallas una hora antes y evitá la cafeína.');
    if (I.water.s >= 1) R.push('Tomaste ' + I.water.val + ' vasos de agua: la meta es 6. Tené la botella a mano.');
    if (I.act.s >= 1) R.push('Hoy llevás ' + I.act.val + ' min de ejercicio: en baja gravedad se pierde hueso y músculo, apuntá a 45 min o más.');
    if (I.react.s >= 1) R.push('Tu reacción está lenta: evitá tareas críticas y repetí el test después de descansar.');
    if (c.s >= 2) R.push('Avisale al oficial médico cómo estás, o tocá «Pedir ayuda».');
  } else if (r === 'cmd') {
    FV.CREW.forEach((m) => { const c = FV.combined(m.id); if (c.s >= 2) A.push({s: c.s, t: m.name + ': ' + FV.STATE[c.s] + (c.f.length ? ' · ' + c.f.join(', ') : '') + '.', call: m.id}); });
    FV.suggestions().slice(0, 5).forEach((x) => R.push(x.who + ': ' + x.t));
  } else if (r === 'esp') {
    Object.entries({p: 'Presión de cabina', o2: 'Oxígeno', co2: 'CO₂', t: 'Temperatura', hu: 'Humedad'}).forEach(([k, n]) => { const s = FV.SHIPR[k](FV.ship[k]); if (s) A.push({s, t: n + ' fuera de rango: ' + FV.f1(FV.ship[k]) + '.'}); });
    FV.risks().filter((x) => x.l === 2).forEach((x) => A.push({s: 2, t: 'Riesgo alto: ' + x.h + '. ' + x.why}));
    FV.risks().filter((x) => x.l >= 1).forEach((x) => R.push(x.h + ': ' + x.mit));
  } else {
    clinicalAlerts().filter((x) => x.s >= 2).forEach((x) => A.push({s: x.s, t: x.who + ' · ' + x.t, call: (FV.CREW.find((m) => m.name === x.who) || {}).id}));
    (S().ppc || []).filter((p) => Date.now() - p.ts < 864e5 * 14).forEach((p) => R.push(crew(p.uid).name + ' pidió una charla privada con el psicólogo: agendarla en la próxima ventana.'));
    FV.CREW.forEach((m) => medSuggest(m.id).slice(0, 2).forEach((t) => R.push(m.name + ': ' + t)));
  }
  return {A, R};
}
const CHIPS = {
  crew: ['Me duele la cabeza', 'No puedo dormir', 'Me siento ansioso', 'Extraño a mi familia', 'No tengo hambre', 'Me falta el aire'],
  cmd: ['¿Quién necesita atención?', 'Resumen del día', 'Riesgos de hoy', 'Alguien no responde', 'Fuego o pérdida de presión'],
  esp: ['Riesgos de hoy', 'CO₂ alto', 'Tormenta solar', 'Pérdida de presión', 'Resumen del día'],
  med: ['Alertas clínicas', 'Sugerencias para Astronauta 3', 'Alguien no responde', 'Dolor de pecho', 'Riesgo de hacerse daño'],
};
function answer(q) {
  q = FVI18N.inEs(q);
  const s = q.toLowerCase(), r = session.role;
  const m = s.match(/astronauta\s*(\d)/);
  if (m && (r === 'med' || r === 'cmd')) { const id = 'a' + m[1]; if (crew(id).name) { const x = medSuggest(id); return {t: crew(id).name, a: (x.length ? x.join(' ') : 'Sin hallazgos fuera de rango.') + ' Estado: ' + FV.label(FV.combined(id).s) + '.', call: id}; } }
  if (/qui[eé]n|atenci[oó]n/.test(s)) { const l = FV.CREW.map((x) => ({x, c: FV.combined(x.id)})).sort((a, b) => b.c.s - a.c.s); return {t: 'Quién necesita atención', a: l.map((y) => y.x.name + ': ' + FV.label(y.c.s) + (y.c.f.length ? ' (' + y.c.f.join(', ') + ')' : '')).join(' · ') + '.'}; }
  if (/resumen|parte|d[ií]a/.test(s) && r !== 'crew') return {t: 'Resumen del día', a: FV.report('dia').split('\n').slice(3, 7).join(' ')};
  if (/riesgo/.test(s) && !/daño/.test(s)) return {t: 'Riesgos de hoy', a: FV.risks().map((x) => x.h + ': ' + ['bajo', 'medio', 'alto'][x.l]).join(' · ') + '.'};
  if (/alertas? cl[ií]nicas?/.test(s)) { const a = clinicalAlerts(); return {t: 'Alertas clínicas', a: a.length ? a.slice(0, 6).map((x) => x.who + ': ' + x.t).join(' · ') + '.' : 'Sin alertas.'}; }
  if (/co2|co₂/.test(s)) return {t: 'CO₂', a: 'Ahora: ' + FV.f1(FV.ship.co2) + ' mmHg (en rango hasta 3). Si sube: revisar depuradores, ventilar el módulo y vigilar dolor de cabeza y concentración en la tripulación.'};
  if (/tormenta solar/.test(s)) return {t: 'Tormenta solar', a: 'Toda la tripulación al refugio blindado, suspender caminatas espaciales y registrar la dosis de cada dosímetro. Radiación del entorno: ' + FV.envOf().rad + '.'};
  const t = FV.topicAnswer(q);
  // Si extraña a la familia o está con el ánimo bajo, le ofrece el diario y mandarles algo.
  if (t && r === 'crew' && /Ánimo bajo/.test(t.t)) return {...t, opts: [['Escribir en mi diario', 'abrir diario'], ['Mandarle algo a mi familia', 'mensaje a mi familia'], ['Pedir charla con el psicólogo', 'abrir diario']]};
  if (t) return t;
  const n = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // "Dolor" sin decir dónde: pregunta dónde, con opciones para tocar o decir.
  if (/dolor|duele|dolio|doler/.test(n)) return {t: '¿Dónde te duele?', a: 'Decime dónde te duele, así te digo qué hacer: cabeza, pecho, panza, espalda o músculos, o si te golpeaste.', opts: [['Cabeza', 'me duele la cabeza'], ['Pecho', 'me duele el pecho'], ['Panza', 'me duele la panza'], ['Espalda o músculos', 'me duele la espalda'], ['Me golpeé', 'me golpee']]};
  if (/^(hola|buenas|buen dia|buenas tardes|buenas noches|hey)\b/.test(n)) return {t: 'Hola', a: '¿Cómo estás? Contame qué te pasa o qué necesitás.', ok: true};
  if (/gracias|genial|perfecto|dale|ok\b|okey|bueno\b/.test(n)) return {t: 'De nada', a: 'Acá estoy. Si algo cambia, decime.', ok: true};
  if (/(estoy|me siento|todo) (bien|joya|tranqui)/.test(n)) return {t: 'Qué bueno', a: 'Me alegro. Si en algún momento te sentís mal, decime y te ayudo.', ok: true};
  if (/(me siento|estoy) mal|no me siento bien|me siento raro/.test(n)) return {t: 'Te escucho', a: 'Contame un poco más: ¿te duele algo, te falta el aire, estás mareado o es algo de ánimo?', opts: [['Me duele algo', 'dolor'], ['Me falta el aire', 'me falta el aire'], ['Estoy mareado', 'estoy mareado'], ['Es el ánimo', 'me siento triste']]};
  return {t: 'No te entendí', a: 'No te entendí bien. ¿Me lo decís con otras palabras? Por ejemplo: «me duele el pecho», «no puedo dormir» o «me siento mal». Si es urgente, decí «ayuda».', miss: true, raw: true};
}
/* ---------- Si el tripulante no logra comunicarse, se avisa al equipo ----------
   Dos respuestas seguidas sin entender: el asistente pregunta si está bien.
   Tres, o si responde que no, o si no contesta en 30 s: avisa al oficial médico y al
   Comandante (puede ser confusión por falta de oxígeno, golpe o malestar). */
let missN = 0, okAsk = 0;
function crewCheck(entry) {
  if (session.role !== 'crew') return;
  if (!entry.miss) { if (!okAsk) missN = 0; return; }
  missN++;
  if (missN === 2 && !okAsk) {
    okAsk = Date.now();
    const asked = okAsk;
    setTimeout(() => proactive('No te estoy entendiendo. ¿Estás bien? Decime «sí» o «no».', [['Estoy bien', () => crewOk()], ['Necesito ayuda', () => crewAlert('pidió ayuda al asistente')]], 2), 900);
    setTimeout(() => { if (okAsk === asked) crewAlert('no respondió cuando el asistente le preguntó si estaba bien'); }, 30000);
  } else if (missN >= 3) crewAlert('no logra comunicarse con claridad con el asistente (' + missN + ' respuestas sin entender). Puede ser confusión, mareo o falta de oxígeno');
}
function crewOk() { okAsk = 0; missN = 0; }
function crewAlert(reason) {
  okAsk = 0; missN = 0;
  FV.sos(session.uid, reason + '.');
  proactive('Avisé al oficial médico y al Comandante para que vengan a verte. Quedate donde estás. Si podés, sentate y respirá despacio.', null, 3);
}
function renderAdvBtn() {
  if (!session) return;
  const {A} = advData(), w = A.length ? Math.max(...A.map((x) => x.s)) : 0;
  $('#advDot').style.background = FV.color(A.length ? w : 0);
  $('#advCount').textContent = A.length ? A.length : '';
}
/* ---------- Panel del asistente: Charla · Alertas · Ayuda · Ajustes ---------- */
let advTab = 'chat', advSeen = 0;
function greetText() {
  const {A} = advData(), r = session.role, name = session.uid ? crew(session.uid).name : '';
  const hi = r === 'crew' ? `Hola, ${name}.` : `Hola, ${FV.ROLES[r].n.toLowerCase()}.`;
  const al = A.length ? ` Hay ${A.length} ${A.length === 1 ? 'alerta' : 'alertas'}; la más importante: ${A.slice().sort((a, b) => b.s - a.s)[0].t.replace(/^Protocolo · /, '').split('. Próximo paso')[0].replace(/\.$/, '')}. Si querés, te guío paso a paso: decime «qué hago».` : ' Todo está en rango.';
  return hi + al + ' Te escucho: preguntame lo que necesites.';
}
function advStatus() {
  const L = window.FVLive, err = L && L.micError ? L.micError() : '';
  if (err) return ['', err];
  if (advLog[0] && advLog[0].t === 'Pensando') return ['think', 'Pensando…'];
  if (L && L.talking('advQ')) return L.micLabel('advQ') === 'Hablando…' ? ['speak', 'Hablando… (cuando termine, te escucho)'] : ['listen', 'Te escucho: hablá cuando quieras'];
  if ('speechSynthesis' in window && speechSynthesis.speaking) return ['speak', 'Hablando…'];
  return ['', 'Tocá «Hablar» o escribí abajo'];
}
function paintAdvStatus() {
  const adv = $('#adv'); if (!adv || adv.hidden || !session) return;
  const [k, t] = advStatus();
  if (adv.dataset.st !== k) adv.dataset.st = k;
  const s = $('#advState'); if (s.textContent !== t) s.textContent = t;
}
setInterval(paintAdvStatus, 300);
function convHtml() {
  const r = session.role;
  const items = pro.map((m) => ({ts: m.ts, m})).concat(advLog.map((x) => ({ts: x.ts || 0, x}))).sort((a, b) => a.ts - b.ts);
  return items.map(({m, x}) => {
    if (m) return `<li class="bot warn" style="--c:${m.lvl >= 3 ? 'var(--bad)' : 'var(--warn)'}"><span class="who">${m.lvl >= 3 ? 'Alerta' : 'Aviso del asistente'} · ${new Date(m.ts).toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit'})}</span>${esc(m.t)}${m.done ? `<div class="acts"><span class="ok">✓ ${esc(m.done)}</span></div>` : m.opts && m.opts.length ? `<div class="acts">${m.opts.map((o, j) => `<button type="button" data-pro="${m.id}" data-j="${j}">${esc(o[0])}</button>`).join('')}</div>` : ''}</li>`;
    const me = x.q ? `<li class="me">${esc(x.q)}</li>` : '';
    const body = x.t === 'Pensando' ? '<span class="adv-typing" aria-label="Pensando"><i></i><i></i><i></i></span>' : x.raw || x.ai || !x.t ? esc(x.a) : `<b>${esc(x.t)}${/[?!.]$/.test(x.t) ? '' : '.'}</b> ${esc(x.a)}`;
    return me + `<li class="bot"><span class="who">Asistente${x.ai ? ' · IA' : ''}</span>${body}${x.opts && x === advLog[0] ? `<div class="acts">${x.opts.map(([l, qq]) => `<button type="button" data-ask="${esc(qq)}">${esc(l)}</button>`).join('')}</div>` : ''}${x.call && r !== 'crew' ? `<div class="acts"><button type="button" data-call="${x.call}">Llamar a ${crew(x.call).name}</button></div>` : ''}</li>`;
  }).join('');
}
function renderAdv() {
  const {A, R} = advData(), r = session.role;
  const calls = r !== 'crew' ? FV.activeCalls() : [];
  const worst = A.length ? Math.max(...A.map((x) => x.s)) : 0;
  const tabs = [['chat', 'Charla', 0], ['alert', 'Alertas', A.length + calls.length], ['help', r === 'crew' ? 'Emergencia' : 'Guía', 0], ['set', 'Ajustes', 0]];
  morph($('#advTabs'), tabs.map(([k, n, c]) => `<button type="button" role="tab" data-advtab="${k}" aria-selected="${advTab === k}">${n}${c ? `<b style="--c:${FV.color(Math.min(worst, 3))}">${c}</b>` : ''}</button>`).join(''));
  let html = '';
  if (advTab === 'chat' && advCheck) {
    const [done, total] = chatDone('mente');
    html = `<div class="adv-note" style="--c:var(--earth)"><span>Chequeo de hoy · ${done} de ${total} · se guarda solo al terminar</span><button type="button" data-checkstop>Pausar</button></div>` +
      `<ol class="adv-conv">${chatBubbles('mente')}</ol>${chatOpts('mente')}`;
  } else if (advTab === 'chat') {
    html = (A.length ? `<div class="adv-note" style="--c:${FV.color(Math.min(worst, 3))}"><span>${A.length} ${A.length === 1 ? 'alerta activa' : 'alertas activas'}</span><button type="button" data-advtab="alert">Ver</button></div>` : '') +
      `<ol class="adv-conv" id="advConv">${convHtml() || `<li class="bot"><span class="who">Asistente</span>${esc(greetText())}</li>`}</ol>`;
  } else if (advTab === 'alert') {
    html = `<section><span class="label">Alertas ahora</span>${A.length ? `<ul class="adv-l">${A.map((x) => `<li style="--c:${FV.color(Math.min(x.s, 3))}">${st(Math.min(x.s, 3), '')}<span>${esc(x.t)}</span>${x.guide || (x.call && r !== 'crew') ? `<div class="acts">${x.guide ? `<button type="button" class="btn-line label" data-pguide="${esc(x.guide)}">Guiame paso a paso</button>` : ''}${x.call && r !== 'crew' ? `<button type="button" class="btn-line label c-bad" data-call="${x.call}">Llamar</button>` : ''}</div>` : ''}</li>`).join('')}</ul>` : '<p class="note">Todo en rango.</p>'}</section>` +
      (calls.length ? `<section><span class="label">Llamadas en curso</span><ul class="adv-l">${calls.map((c) => `<li style="--c:var(--bad)">${st(2, '')}<span>${crew(c.uid).name}: ${CALL_TXT[c.status]}${c.steps.length ? ' · ' + esc(c.steps[c.steps.length - 1].t) : ''}</span></li>`).join('')}</ul></section>` : '') +
      `<section><span class="label">Recomendaciones</span>${R.length ? `<ul class="adv-r">${R.map((x) => `<li>${x}</li>`).join('')}</ul>` : '<p class="note">Sin recomendaciones nuevas.</p>'}</section>`;
  } else if (advTab === 'help') {
    html = (r === 'crew' ? `<section><button type="button" class="adv-sos" data-sos>Pedir ayuda ahora</button><p class="note">Avisa al instante al oficial médico y al Comandante.</p></section>` : '') +
      `<section><span class="label">Qué hacer según la gravedad</span>${protocol(advLv)}</section>`;
  } else {
    html = (window.FVLive ? `<section><span class="label">Voz del asistente</span>${FVLive.voicePanel()}</section>` : '') +
      `<section class="ai-set"><span class="label">Conectar IA (opcional)</span>
      <p class="note"><b>IA local, gratis y de código abierto.</b> Un modelo abierto (Qwen o Llama, vía WebLLM) corre dentro de tu navegador: sin clave, sin costo y sin mandar datos a nadie. La primera vez descarga ~1 GB. Necesita Chrome o Edge.</p>
      <div class="adv-row"><button type="button" class="btn label" data-ailocal>${window.FVAI && FVAI.provider() === 'local' && FVAI.enabled() ? 'IA local activa ✓' : 'Activar IA local gratis'}</button>${window.FVAI && FVAI.enabled() ? '<button type="button" class="btn-line label" data-aioff>Apagar IA</button>' : ''}</div>
      <p class="note"><b>Gemini.</b> Con una clave de Google AI Studio.</p>
      <div class="adv-row"><label class="sr" for="aiKey">Clave de Gemini</label><input type="password" id="aiKey" autocomplete="off" placeholder="${window.FVAI && FVAI.provider() === 'gemini' && FVAI.enabled() ? 'Clave guardada' : 'Pegá tu clave'}"><button type="button" class="btn-line label" data-aicon>Conectar</button></div>
      <p class="label ${window.FVAI && FVAI.enabled() ? 'c-ok' : 'dim'} ai-st">${esc(window.FVAI ? FVAI.status() : 'Módulo de IA no cargado')}</p></section>`;
  }
  const body = $('#advBody'), atEnd = body.scrollHeight - body.scrollTop - body.clientHeight < 60;
  if (body.dataset.tab !== advTab) { body.dataset.tab = advTab; body.innerHTML = html; body.scrollTop = advTab === 'chat' ? body.scrollHeight : 0; }
  else morph(body, html);
  // En la charla, si llegó algo nuevo, baja solo hasta el último mensaje.
  const n = pro.length + advLog.length;
  if (advTab === 'chat' && (n !== advSeen || atEnd)) body.scrollTop = body.scrollHeight;
  advSeen = n;
  morph($('#advChips'), CHIPS[r].map((c) => `<button type="button" data-ask="${esc(c)}">${esc(c)}</button>`).join(''));
  $('#advHow').textContent = window.FVAI && FVAI.enabled() ? 'IA conectada · no reemplaza al médico' : 'Responde con los datos de la misión · no reemplaza al médico';
  syncAdvVoice(); paintAdvStatus();
}
let advLv = 0;
/* Abrir el asistente. Si lo abre la persona (un toque), saluda en voz alta y queda
   escuchando solo: no hace falta tocar nada más para charlar. */
function openAdv(byUser, quiet) {
  advLv = session.role === 'crew' ? Math.min(FV.combined(session.uid).s, 3) : 0;
  advTab = 'chat';
  const wasHidden = $('#adv').hidden;
  $('#adv').hidden = false; $('#advBtn').setAttribute('aria-expanded', 'true');
  if (byUser && wasHidden && !quiet && window.FVLive && !FVLive.talking('advQ')) {
    let g = greetText(), opts = null;
    // Si el tripulante todavía no hizo su chequeo de hoy, el asistente lo ofrece: lo completa charlando.
    if (session.role === 'crew' && !advCheck && !doneToday(session.uid).mind) {
      g += ' ¿Hacemos tu chequeo de hoy? Son preguntas cortas y lo completo yo con lo que me digas.';
      opts = [['Sí, hagámoslo', 'hagamos el chequeo'], ['Más tarde', 'mas tarde']]; offerCheck = true;
    }
    advLog.unshift({q: null, t: '', a: g, raw: true, ts: Date.now(), opts});
    if (!FVLive.toggleTalk('advQ', g)) FVLive.speak(g); // sin reconocimiento de voz, al menos habla
  }
  renderAdv();
  $('#advQ').focus({preventScroll: true});
}
function closeAdv() {
  $('#adv').hidden = true; $('#advBtn').setAttribute('aria-expanded', 'false');
  if (window.FVLive && FVLive.talking('advQ')) FVLive.toggleTalk('advQ');
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
$('#advBtn').addEventListener('click', () => ($('#adv').hidden ? openAdv(true) : closeAdv()));
$('#advTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-advtab]'); if (b) { advTab = b.dataset.advtab; renderAdv(); } });
$('#advClose').addEventListener('click', () => { closeAdv(); $('#advBtn').focus(); });
$('#advAsk').addEventListener('submit', (e) => { e.preventDefault(); const q = $('#advQ').value.trim(); if (!q) return; ask(q); $('#advQ').value = ''; });
/* Contexto que recibe la IA según el rol: solo lo que ese rol puede ver. */
function aiContext() {
  const r = session.role;
  if (r === 'crew') { const I = FV.ind(session.uid), c = FV.combined(session.uid); return `Tripulante: ${crew(session.uid).name}. Estado: ${FV.label(c.s)}. ` + Object.values(I).map((x) => `${x.n} ${x.val} ${x.u} (${FV.label(x.s)})`).join('; ') + '.'; }
  let s = FV.report('dia');
  if (r === 'med') s += '\nSugerencias clínicas por reglas:\n' + FV.CREW.map((m) => m.name + ': ' + (medSuggest(m.id).join(' ') || 'sin hallazgos')).join('\n');
  if (r === 'esp') s += '\nNave: presión ' + FV.f1(FV.ship.p) + ' kPa, O2 ' + FV.f1(FV.ship.o2) + ' %, CO2 ' + FV.f1(FV.ship.co2) + ' mmHg, temperatura ' + FV.f1(FV.ship.t) + ' °C, humedad ' + Math.round(FV.ship.hu) + ' %.';
  return s;
}
const ROLE_AI = {
  crew: 'Sos el asistente personal de salud del tripulante: acompañás, orientás con 2 o 3 pasos concretos y sugerís avisar al oficial médico cuando corresponde. No diagnosticás ni indicás medicación.',
  cmd: 'Sos el asistente del comandante: resumís quién necesita atención y por qué, proponés decisiones operativas concretas (turnos, descanso, reasignar tareas, contactar al médico) priorizadas por urgencia. Lo clínico lo decide el oficial médico.',
  esp: 'Sos el asistente del especialista de misión: explicás riesgos del entorno y de la nave para la tripulación y cómo mitigarlos.',
  med: 'Sos el asistente clínico del oficial médico: hablás como colega, técnico y conciso; hallazgos, qué considerar, qué medir y opciones de manejo a su criterio. Verificar dosis contra los protocolos de la misión. La decisión es del médico.',
};
/* Respuestas fijas e inmediatas (sin esperar a la IA): guía de protocolos paso a paso,
   emergencias y sueño. Así la charla por voz no se traba en lo importante. */
const DONE_RE = /^(listo|lista|hecho|hecha|ya|ya esta|ya lo hice|siguiente|sigamos|ok|okey|dale|terminado|termine|paso hecho)\b/;
// Al cambiar de idioma, el panel del asistente se redibuja (ajustes de voz, saludo).
document.addEventListener('fv:lang', () => { if (session && document.body.dataset.view === 'app' && !$('#adv').hidden) renderAdv(); });
// Con la app en inglés, la IA responde en inglés (las instrucciones siguen en español).
const AI_LANG = () => (FVI18N.lang === 'en' ? ' IMPORTANT: the user speaks English. Reply ONLY in clear, simple English (no voseo).' : '');
function quick(q) {
  q = FVI18N.inEs(q);
  const s = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[¡!¿?.,]/g, '').trim();
  // Respuesta a «¿Estás bien?»
  if (okAsk) {
    if (/^(si|sii|sip|estoy bien|bien|todo bien|tranqui|ya estoy bien)\b/.test(s)) { crewOk(); return {t: 'Qué alivio', a: 'Bueno, me quedo tranquilo. Contame qué necesitás, con tus palabras.', raw: true}; }
    if (/^(no|mal|ayuda|auxilio|me siento mal)\b/.test(s)) { setTimeout(() => crewAlert('respondió que no está bien'), 50); return {t: 'Aviso', a: 'Ya aviso al equipo.', raw: true}; }
  }
  // Familia y diario: el asistente lleva a la pestaña.
  if (session.role === 'crew' && /(abrir|escribir en|ir al) (mi )?diario|^diario$|mensaje (a|para) mi familia|abrir familia|mandar(le)? (algo|una foto|un audio)/.test(s)) {
    setTimeout(() => { tab = 'familia'; closeAdv(); render(); window.scrollTo(0, 0); }, 900);
    return {t: '', a: 'Dale, te abro «Familia y diario». Ahí podés escribir en tu diario o mandarles algo.', raw: true};
  }
  // Ofrecimiento del chequeo diario.
  if (session.role === 'crew' && (/(hagamos|empecemos|hacer) (el )?chequeo|^chequeo$/.test(s) || (offerCheck && /^(si|sii|dale|bueno|ok|okey|de una|hagamoslo|vamos)\b/.test(s)))) { setTimeout(() => startCheckInAdv(true), 50); return {t: '', a: 'Dale, empecemos.', raw: true}; }
  if (offerCheck && /^(mas tarde|despues|luego|ahora no|no)\b/.test(s)) { offerCheck = false; return {t: '', a: 'Dale, te lo recuerdo más tarde. ¿Te ayudo con otra cosa?', raw: true}; }
  if (session.role === 'crew' && /^(ayuda|auxilio|socorro|emergencia)\b/.test(s)) { setTimeout(() => crewAlert('pidió ayuda por voz'), 50); return {t: 'Aviso', a: 'Pido ayuda ya.', raw: true}; }
  if (guideId && DONE_RE.test(s)) return {t: 'Paso a paso', a: guideText(guideId, true), raw: true};
  if (guideId && /repet|otra vez|no entend|como era/.test(s)) return {t: 'Paso a paso', a: guideText(guideId, false), raw: true};
  if (/protocolo|que (hago|tengo que hacer|hacemos)|pasos? a seguir|que sigue|que paso/.test(s)) {
    const l = protoFor(FV.protocols());
    if (l.length) { const p = l.find((x) => x.steps.some((y) => !y.done)) || l[0]; return {t: 'Protocolo activo', a: (l.length > 1 ? `Hay ${l.length} protocolos activos; empiezo por el más grave. ` : '') + guideText(p.id, false), raw: true}; }
  }
  if (/sueno|dorm|durm/.test(s) && /fase|tipo|profundo|rem|como (dormi|durmi)/.test(s)) {
    const m = s.match(/astronauta\s*(\d)/), id = m ? 'a' + m[1] : session.role === 'crew' ? session.uid : null;
    if (id && crew(id).name && (session.role !== 'crew' || id === session.uid)) {
      const N = FV.sleepNight(id);
      return {t: 'Sueño de ' + crew(id).name, a: `Sueño ${N.tipo.toLowerCase()}: ${Math.floor(N.asleep / 60)} horas y ${N.asleep % 60} minutos dormido, ${Math.round(N.pct.D * 100)} % de sueño profundo, ${Math.round(N.pct.R * 100)} % de REM, ${N.wake} despertares y ${N.lat} minutos para dormirse.`};
    }
  }
  const t = FV.topicAnswer(q);
  if (t && t.g >= 2) return t; // emergencias: siempre la guía fija, al instante
  return null;
}
async function ask(q) {
  // Durante el chequeo, lo que dice la persona responde las preguntas (salvo emergencias o pedidos de ayuda).
  let pre;
  if (advCheck && session.role === 'crew') {
    pre = quick(q);
    if (!pre || !(pre.g >= 2 || pre.raw)) { advTab = 'chat'; sayAny('mente', q); return; }
  }
  const entry = {q, t: 'Pensando', a: '…', ts: Date.now()};
  advTab = 'chat';
  advLog.unshift(entry); if (advLog.length > 8) advLog.pop();
  renderAdv();
  const say = (t) => { if (window.FVLive) FVLive.speak(t); };
  const fast = pre !== undefined ? pre : quick(q);
  if (fast) Object.assign(entry, fast);
  else if (window.FVAI && FVAI.enabled()) {
    const byVoice = window.FVLive && FVLive.talking('advQ');
    const sys = `${ROLE_AI[session.role]} App FAVALORO (monitoreo de salud de astronautas), ${FV.envOf().n}. Español rioplatense con voseo, ${byVoice ? 'estás hablando en voz alta: máximo 45 palabras, frases cortas, como en una charla' : 'máximo 120 palabras'}, texto plano sin markdown. Ante una emergencia (no respira, dolor de pecho, falta de aire, fuego, ideas de hacerse daño) indicá primero activar la alarma y avisar al oficial médico y al Comandante. Sos una IA y no reemplazás al médico.${AI_LANG()} Datos simulados de la misión:\n${aiContext()}`;
    const hist = advLog.slice(1).reverse().flatMap((x) => [{who: 'me', t: x.q}, {who: 'bot', t: x.a}]).concat([{who: 'me', t: q}]);
    // La voz arranca con la primera frase completa, sin esperar el resto de la respuesta.
    let text = '', spokenTo = 0, got = false, dead = false, lastR = 0;
    const flush = (end) => {
      for (;;) {
        const rest = text.slice(spokenTo), m = end ? (rest.trim() ? [rest] : null) : rest.match(/^[\s\S]*?[.!?…:;](?=\s)/);
        if (!m) break;
        say(m[0].trim()); spokenTo += m[0].length;
        if (end) break;
      }
    };
    try {
      await Promise.race([
        FVAI.askStream(sys, hist, (d) => {
          if (dead) return;
          got = true; text += d;
          Object.assign(entry, {t: FVAI.provider() === 'local' ? 'IA local' : 'Gemini', a: text, ai: true});
          flush(false);
          if (performance.now() - lastR > 250) { lastR = performance.now(); renderAdv(); }
        }, byVoice ? 140 : 300),
        new Promise((_, rej) => setTimeout(() => { if (!got) rej(new Error('lenta')); }, 9000)),
      ]);
      flush(true);
    } catch (e) {
      dead = true;
      if (!got) { Object.assign(entry, answer(q)); entry.slow = e.message === 'lenta'; }
      else flush(true);
    }
  } else Object.assign(entry, answer(q));
  if (entry.g >= 3) advLv = 3;
  renderAdv(); const b = $('#advBody'); if (b) b.scrollTop = b.scrollHeight;
  if (!entry.ai) say(entry.raw || /[?!]$/.test(entry.t) ? entry.a : entry.t + '. ' + entry.a);
  crewCheck(entry);
  // Un síntoma grave contado por el propio tripulante avisa solo al equipo.
  if (session.role === 'crew' && entry.g >= 3 && !entry.ai) crewAlert('reportó al asistente: ' + entry.t.toLowerCase());
}
function syncAdvVoice() {
  const t = $('#advTalk'), v = $('#advVoice'); if (!t || !window.FVLive) return;
  const on = FVLive.talking('advQ'), l = t.querySelector('.lbl');
  t.setAttribute('aria-pressed', String(on)); if (l) l.textContent = on ? 'Pausar' : 'Hablar';
  t.setAttribute('aria-label', on ? 'Pausar la conversación por voz' : 'Hablar con el asistente');
  v.setAttribute('aria-pressed', String(FVLive.voiceOn())); v.textContent = FVLive.voiceOn() ? 'Voz: sí' : 'Voz: no';
  const mt = $('#advMute'); if (mt) { const m = FVLive.muted(); mt.setAttribute('aria-pressed', String(m)); mt.textContent = m ? `Silenciadas · ${FVLive.muteLeft()} min` : 'Alertas: con sonido'; }
}
// Mantiene al día los botones de conversación cuando el micrófono se pausa solo.
function syncVoice() {
  syncAdvVoice();
  document.querySelectorAll('[data-talk]').forEach((b) => {
    const on = FVLive.talking(b.dataset.talk), l = b.querySelector('.lbl');
    b.setAttribute('aria-pressed', String(on)); if (l) l.textContent = on ? 'Pausar' : 'Hablar';
  });
}
$('#adv').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.pro) {
    const m = pro.find((x) => x.id === b.dataset.pro); if (!m) return;
    const o = m.opts[+b.dataset.j]; m.done = o[0];
    if (o[1]) o[1]();
    renderAdv();
    return;
  }
  if (b.dataset.mic) { if (window.FVLive) FVLive.listen(b); return; }
  if (b.dataset.pguide) { proactive(guideText(b.dataset.pguide, false), guideOpts(b.dataset.pguide)); return; }
  if (b.dataset.say) { sayAny(b.dataset.kind, b.dataset.say); return; }
  if (b.hasAttribute('data-checkstop')) { advCheck = false; advLog.unshift({q: null, t: '', a: 'Dale, lo dejamos acá. Lo que ya me contaste queda guardado para cuando sigamos.', raw: true, ts: Date.now()}); renderAdv(); if (window.FVLive) FVLive.speak(advLog[0].a); return; }
  if (b.dataset.vstyle) { FVLive.setStyle(b.dataset.vstyle); $$('[data-vstyle]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); FVLive.testVoice(); return; }
  if (b.hasAttribute('data-vtest')) { FVLive.testVoice(); return; }
  if (b.id === 'advTalk') { if (window.FVLive) FVLive.toggleTalk('advQ'); syncAdvVoice(); return; }
  if (b.id === 'advVoice') { if (window.FVLive) FVLive.toggleVoice(); syncAdvVoice(); return; }
  if (b.id === 'advMute' || b.hasAttribute('data-mute')) { toggleMute(); return; }
  if (b.hasAttribute('data-aicon')) { const k = $('#aiKey').value; $('.ai-st').textContent = 'Conectando…'; FVAI.connect(k).then(() => { renderAdv(); if (document.body.dataset.view === 'app') render(); }); return; }
  if (b.hasAttribute('data-aioff')) { FVAI.disconnect(); renderAdv(); render(); return; }
  if (b.hasAttribute('data-ailocal')) {
    b.disabled = true;
    FVAI.connectLocal((p) => { const st = $('.ai-st'); if (st) st.textContent = p; }).then(() => { renderAdv(); if (document.body.dataset.view === 'app') render(); });
    return;
  }
  if (b.dataset.ask) ask(b.dataset.ask);
  else if (b.dataset.lv) { advLv = +b.dataset.lv; renderAdv(); }
  else if (b.dataset.call) { FV.startCall(b.dataset.call, session.role); renderAdv(); render(); }
  else if (b.hasAttribute('data-sos')) { FV.sos(session.uid); renderAdv(); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#adv').hidden) { closeAdv(); $('#advBtn').focus(); } });
$('#adv').addEventListener('change', (e) => { if (e.target.id === 'vSel' && window.FVLive) { FVLive.setVoice(e.target.value); FVLive.testVoice(); } });

/* ---------------- eventos de la app ---------------- */
const EX = {ok: [3, 0, 0, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0], warn: [2, 1, 1, 2, 2, 2, 2, 1, 2, 2, 1, 2, 2, 1], bad: [0, 2, 2, 0, 0, 0, 4, 4, 4, 4, 3, 4, 4, 4]};
function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
$('#appMain').addEventListener('click', (e) => {
  const b = e.target.closest('button, #rx'); if (!b) return;
  const d = b.dataset, s = session;
  if (d.tab) { tab = d.tab; render(); window.scrollTo(0, 0); return; }
  if (b.hasAttribute('data-adv')) { openAdv(true); return; }
  if (d.mode) { fillMode = d.mode; render(); return; }
  if (d.mic) { if (window.FVLive) FVLive.listen(b); return; }
  if (b.hasAttribute('data-voice')) { if (window.FVLive) FVLive.toggleVoice(); render(); return; }
  if (d.talk) { if (window.FVLive) { FVLive.toggleTalk(d.talk); render(); } return; }
  if (b.id === 'bandBtn') { if (window.FVLive) FVLive.connectBand(s.uid); return; }
  if (b.id === 'schedSave') { S().sched = S().sched || {}; S().sched[s.uid] = $('#schedTime').value || '08:00'; FV.save(); b.textContent = 'Guardado ✓'; return; }
  if (b.id === 'notifBtn') { if ('Notification' in window) Notification.requestPermission().then(() => render()); return; }
  if (b.id === 'simHigh') { FV.simulate(s.uid, 'fiebre', 90); b.textContent = 'Simulando 90 s…'; return; }
  if (b.id === 'simNow') { if (window.FVLive) FVLive.dailyNow(); return; }
  if (d.say) { sayAny(d.kind, d.say); return; }
  if (b.hasAttribute('data-aiset')) { openAdv(); advTab = 'set'; renderAdv(); setTimeout(() => { const k = $('#aiKey'); if (k) k.scrollIntoView({block: 'center'}), k.focus(); }, 60); return; }
  if (d.q !== undefined) { ans[d.q] = +d.v; autoKeys.delete(+d.q); savedMsg = ''; mindEval(); return; }
  if (d.ex) { EX[d.ex].forEach((v, i) => { ans[i] = v; }); savedMsg = ''; mindEval(); return; }
  if (b.id === 'mClear') { Object.keys(ans).forEach((k) => delete ans[k]); savedMsg = ''; mindEval(); return; }
  if (b.id === 'mSave') { saveMind(); mindEval(); return; }
  // Tests
  if (d.vt) { vt[d.vt] = +d.v; vt.msg = ''; render(); return; }
  if (b.id === 'vtSave') {
    if ([vt.L, vt.R, vt.blur, vt.ache].some((x) => x === null)) { vt.msg = 'Contestá las cuatro preguntas.'; render(); return; }
    const eyes = [['izquierdo', vt.L], ['derecho', vt.R]].filter(([, x]) => x > 0).map(([e, x]) => 'Ojo ' + e + ': ' + (x === 1 ? 'líneas onduladas' : 'falta una zona'));
    const sx = Math.max(vt.L, vt.R) === 2 ? 2 : Math.max(vt.L, vt.R, vt.blur === 2 ? 1 : 0, vt.ache === 2 ? 1 : 0);
    const detail = eyes.concat(vt.blur ? ['visión borrosa de cerca'] : [], vt.ache === 2 ? ['dolor de cabeza al despertar'] : []).join(', ') || 'Sin cambios';
    FV.saveTest(s.uid, 'vis', {s: Math.min(sx, 2), detail});
    vt.msg = sx ? 'Guardado. Le avisé al oficial médico para que te revise los ojos.' : 'Guardado: sin cambios. Repetilo la semana que viene.';
    if (window.FVLive) FVLive.speak(vt.msg); vt.L = vt.R = vt.blur = vt.ache = null; render(); return;
  }
  if (b.id === 'memGo') { Object.assign(mem, {len: 4, best: 0, fails: 0, msg: ''}); memNext(); return; }
  if (b.id === 'stpGo') { Object.assign(stp, {phase: 'run', i: 0, ok: 0, ms: [], msg: ''}); stpNext(); return; }
  if (d.stp !== undefined) { if (stp.phase !== 'run') return; stp.ms.push(performance.now() - stp.t0); if (COLORS[+d.stp] === stp.cur.ink) stp.ok++; stp.i++; stpNext(); return; }
  if (b.id === 'audGo') { Object.assign(aud, {phase: 'run', i: 0, lvl: 0, res: {}, msg: ''}); if ('speechSynthesis' in window) speechSynthesis.cancel(); render(); setTimeout(audPlay, 300); return; }
  if (b.id === 'audPlay') { audPlay(); return; }
  if (d.aud !== undefined) { audAnswer(d.aud === '1'); return; }
  if (d.hpd !== undefined) { S().hpd = S().hpd || {}; S().hpd[s.uid] = +d.hpd; FV.save(); render(); return; }
  // Botiquín y consulta
  if (d.kituse) { FV.kitUse(d.kituse, ($('#kitWho') || {}).value || 'a1'); render(); return; }
  if (b.id === 'conSend') {
    const t = ($('#conText') || {}).value || '';
    if (!t.trim() && !conMedia.length) { conMsg = 'Escribí los síntomas o la pregunta.'; render(); return; }
    const c = FV.sendConsult(medSel, t.trim(), conMedia.slice()); conMedia = []; $('#conText').value = '';
    conMsg = 'Enviada. Llega a la Tierra a las ' + hhmm(c.real.arrive) + ' y la respuesta vuelve a las ' + hhmm(c.real.replyAt) + (FV.comms().every ? ' (espera los pases del orbitador)' : '');
    [c.demo.arrive, c.demo.replyAt].forEach((at) => setTimeout(() => { if (tab === 'tierra') render(); if (at === c.demo.replyAt && window.FVLive) FVLive.announce('Llegó la respuesta de la Tierra para ' + crew(c.uid).name + '.', 1); }, at - Date.now() + 150));
    render(); return;
  }
  if (b.id === 'diarySave') { diarySave(); return; }
  if (b.id === 'diaryNew') { diary.n = (diary.n + 1) % DIARY_P.length; diary.log.push({who: 'bot', t: DIARY_P[diary.n]}); render(); if (window.FVLive) FVLive.speakNew('diario', diary.log); return; }
  if (d.famidea) { const t = $('#famText'); t.value = (t.value ? t.value.trim() + ' ' : '') + d.famidea + '. '; t.focus(); return; }
  if (b.id === 'famRec') { toggleRec(); return; }
  if (b.id === 'famSend') { famSend(); return; }
  if (b.hasAttribute('data-famread')) { const f = famSeed(s.uid); if (window.FVLive) FVLive.speak(f.in.slice(-2).map((m) => 'Mensaje de ' + m.from + ': ' + m.t).join(' ')); return; }
  if (b.id === 'ppcAsk') { fam().ppc.push({id: FV.nid(), uid: s.uid, ts: Date.now()}); FV.save(); render(); if (window.FVLive) FVLive.speak('Listo, pedí tu charla privada con el psicólogo para la próxima ventana de comunicación. El oficial médico solo ve que la pediste.'); return; }
  if (b.id === 'breathBtn') { breathe(); return; }
  if (b.id === 'groundBtn') { if (window.FVLive) FVLive.speak(GROUND); return; }
  if (b.hasAttribute('data-checkadv')) { startCheckInAdv(true); return; }
  if (d.nq) { nq[d.nq] = +d.v; nMsg = ''; render(); return; }
  if (d.water !== undefined) { water = +d.water; nMsg = ''; render(); return; }
  if (b.id === 'nSave') { S().nutri.push({id: FV.nid(), uid: s.uid, kind: 'dq', ts: Date.now(), ap: nq.ap, me: nq.me, fl: nq.fl, gi: nq.gi, water}); FV.save(); Object.keys(nq).forEach((k) => delete nq[k]); water = null; chats.nutri = []; nMsg = 'Chequeo de hoy guardado.'; render(); return; }
  if (b.id === 'nMassSave') {
    const kg = parseFloat(String($('#nMass').value).replace(',', '.'));
    if (!(kg >= 20 && kg <= 300)) { nMsg = 'Ingresá un valor entre 20 y 300 kg.'; render(); return; }
    S().nutri.push({id: FV.nid(), uid: s.uid, kind: 'mass', ts: Date.now(), kg: Math.round(kg * 10) / 10}); FV.save(); massIn = ''; nMsg = 'Masa guardada.'; render(); return;
  }
  if (d.mood) { regDraft.mood = +d.mood; $$('[data-mood]').forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.mood === regDraft.mood))); return; }
  if (b.id === 'rSave') {
    const n = (id) => { const v = parseFloat($(id).value); return isFinite(v) ? v : null; };
    const prev = S().regs.find((r) => r.uid === s.uid && FV.dayOf(r.ts) === today() && !r.demo);
    const rec = prev || {id: FV.nid(), uid: s.uid, ts: Date.now()};
    Object.assign(rec, {glu: n('#rGlu'), sys: n('#rSys'), dia: n('#rDia'), ts: Date.now()});
    const md = regDraft.mood ?? moodToday(s.uid); if (md) rec.mood = md;
    if (!prev) S().regs.push(rec);
    FV.save(); regMsg = 'Registros guardados.'; render(); return;
  }
  if (b.id === 'rx') { reactClick(); return; }
  if (d.approve) { S().decisions.push({id: FV.nid(), ts: Date.now(), key: d.approve, text: d.text}); FV.save(); render(); return; }
  if (b.id === 'dSave') { const t = $('#dText').value.trim(); if (!t) { decMsg = 'Escribí la decisión antes de guardar.'; render(); return; } S().decisions.push({id: FV.nid(), ts: Date.now(), key: 'manual', text: t}); FV.save(); decMsg = 'Decisión guardada.'; render(); return; }
  if (d.send) { FV.sendReport(d.send); repMsg = (d.send === 'semana' ? 'Reporte semanal' : 'Reporte diario') + ' enviado a Control de Misión (simulado).'; render(); return; }
  if (d.dl) { download('favaloro-reporte-' + (d.dl === 'semana' ? 'semanal' : 'diario') + '-' + today() + '.txt', FV.report(d.dl)); return; }
  if (d.copy) { const t = FV.report(d.copy); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { repMsg = 'Reporte copiado.'; render(); }).catch(() => { repMsg = 'No se pudo copiar: seleccioná el texto del reporte.'; render(); }); return; }
  if (d.lv) { emLv = +d.lv; render(); return; }
  if (d.env) { S().env = d.env; FV.save(); render(); return; }
  if (b.id === 'co2Fail') { S().co2Target = S().co2Target > 3.5 ? 2.6 : 4.8; FV.save(); render(); return; }
  if (d.crisis) { FV.eclssCrisis(d.crisis === 'on'); render(); return; }
  if (d.step) { FV.eclssStep(d.step, +d.orden); render(); return; }
  if (d.pstep) { FV.protoStep(d.pstep, +d.i); render(); return; }
  if (b.hasAttribute('data-mute')) { toggleMute(); return; }
  if (d.pguide) { const g = guideText(d.pguide, false); proactive(g, guideOpts(d.pguide)); return; }
  if (b.hasAttribute('data-storm')) { FV.radStorm(!S().radStorm); watchProtocols(); render(); return; }
  if (b.hasAttribute('data-simfever')) { FV.simulate('a2', 'hipoxia', 240); setTimeout(() => { watchProtocols(); render(); }, 2600); return; }
  if (d.rad) { radSel = d.rad; render(); return; }
  if (d.call) { FV.startCall(d.call, s.role); render(); return; }
  if (d.closeCall) { FV.closeCall(d.closeCall); render(); return; }
  if (d.med) { medSel = d.med; if (s.role === 'med' && tab === 'crew') tab = 'ficha'; render(); }
});
$('#appMain').addEventListener('keydown', (e) => { if (e.target.id === 'rx' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); reactClick(); } });
$('#appMain').addEventListener('input', (e) => { if (e.target.id === 'nMass') massIn = e.target.value; });
$('#appMain').addEventListener('change', (e) => {
  if (e.target.id === 'famPhoto' && e.target.files[0]) { addPhoto(e.target.files[0]); e.target.value = ''; }
  if (e.target.id === 'conPhoto' && e.target.files[0]) { addPhoto(e.target.files[0], conMedia); e.target.value = ''; }
  if (e.target.id === 'fastDemo') { S().commsFast = e.target.checked; FV.save(); render(); }
});
$('#appMain').addEventListener('submit', (e) => {
  if (e.target.matches('[data-mem]')) { e.preventDefault(); memAnswer($('#memIn').value); return; }
  if (e.target.matches('[data-diary]')) { e.preventDefault(); const q = $('#diaryQ'), t = q.value.trim(); if (!t) return; q.value = ''; diarySay(t); return; }
  const f = e.target.closest('[data-chat]'); if (!f) return;
  e.preventDefault();
  const t = $('#chatQ').value.trim(); if (!t) return;
  $('#chatQ').value = '';
  sayAny(f.dataset.chat, t);
});

function reactClick() {
  const set = () => { render(); const el = $('#rx'); if (el) el.focus(); };
  if (rx.state === 'idle' || rx.state === 'done') {
    if (rx.tries.length >= 3) rx.tries = [];
    rx.state = 'wait'; set();
    rx.timer = setTimeout(() => { rx.state = 'go'; rx.t0 = performance.now(); set(); }, 1500 + Math.random() * 2000);
  } else if (rx.state === 'wait') { clearTimeout(rx.timer); rx.state = 'idle'; set(); }
  else if (rx.state === 'go') {
    rx.tries.push(Math.round(performance.now() - rx.t0));
    rx.state = 'idle';
    if (rx.tries.length >= 3) {
      const avg = Math.round(rx.tries.reduce((a, b) => a + b, 0) / 3);
      const prev = S().regs.find((r) => r.uid === session.uid && FV.dayOf(r.ts) === today() && !r.demo);
      if (prev) { prev.react = avg; prev.ts = Date.now(); } else S().regs.push({id: FV.nid(), uid: session.uid, ts: Date.now(), react: avg});
      FV.save(); rx.state = 'done';
    }
    set();
  }
}

/* ---------- El asistente vigila los protocolos ----------
   Cada 4 s: si se abre un protocolo nuevo, avisa en voz alta con el primer paso.
   Si uno crítico sigue sin ningún paso hecho a los 90 s, escala: avisa al
   Comandante y al oficial médico y, si es de un tripulante, lo llama (si no
   contesta, la llamada sigue escalando sola al compañero más cercano y a Tierra). */
let guideId = null;
const protoSeen = new Set();
const ESC_MS = 90000;
function guideText(id, advance) {
  const p = FV.protocols().find((x) => x.id === id);
  if (!p) { guideId = null; return 'Ese protocolo ya no está activo: la condición volvió a la normalidad.'; }
  guideId = id;
  let nx = p.steps.findIndex((s) => !s.done);
  if (advance && nx >= 0) { FV.protoStep(id, nx); nx = FV.protocols().find((x) => x.id === id).steps.findIndex((s) => !s.done); }
  if (nx < 0) { guideId = null; return `Listo, completaste el protocolo «${p.t}». Sigo vigilando.`; }
  return `${advance ? 'Bien. ' : p.t + '. '}Paso ${nx + 1} de ${p.steps.length}: ${p.steps[nx].t} Cuando lo hagas, decime «listo».`;
}
const guideOpts = (id) => [['Listo, siguiente', () => { const t = guideText(id, true); render(); setTimeout(() => proactive(t, guideId ? guideOpts(id) : null), 50); }], ['Repetir', () => setTimeout(() => proactive(guideText(id, false), guideOpts(id)), 50)]];
function watchProtocols() {
  if (!session || document.body.dataset.view !== 'app') return;
  const all = FV.protocols(); FV.protoTrack(all);
  crisisCheck(all);
  const mine = protoFor(all), now = Date.now();
  // Las crisis ya se anuncian con su llamada y cuenta regresiva: no se repiten acá.
  const fresh = mine.filter((p) => !protoSeen.has(p.id) && !(p.lvl >= 3 && CRISIS.test(p.id)));
  all.forEach((p) => protoSeen.add(p.id));
  [...protoSeen].forEach((id) => { if (!all.some((p) => p.id === id)) protoSeen.delete(id); });
  if (fresh.length && fresh[0].id !== guideId) {
    const p = fresh[0];
    proactive(`Atención: ${p.t}. ${protoWhy(p)} Abrí el protocolo. ${guideText(p.id, false).replace(p.t + '. ', '')}`, guideOpts(p.id), Math.max(1, Math.min(p.lvl, 3)));
  }
  all.filter((p) => p.lvl >= 3 && !p.esc && !p.steps.some((s) => s.done) && now - p.since > ESC_MS).forEach((p) => {
    FV.protoEscalate(p.id);
    const m = FV.CREW.find((c) => p.who === c.name);
    if (m) FV.startCall(m.id, 'asistente');
    if (session.role !== 'crew' || (m && m.id === session.uid)) proactive(`Escalé «${p.t}»: pasaron 90 segundos sin ningún paso hecho. Avisé al Comandante y al oficial médico${m ? ' y estoy llamando a ' + m.name : ''}.`, null, 3);
  });
  if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (tab === 'risk' || (session.role === 'crew' && tab === 'hoy')) render();
}
setInterval(watchProtocols, 4000);

/* Lo que usa live.js (micrófono, Bluetooth, chequeo diario y avisos). */
window.FVApp = {
  session: () => session,
  inApp: () => document.body.dataset.view === 'app',
  proactive, syncVoice,
  // Chequeo diario: lo abre el asistente y la charla arranca con su saludo (no queda después de la pregunta).
  openDaily(text) {
    if (!chats.mente.length) chatStart('mente', text);
    startCheckInAdv();
  },
  doneMindToday: () => session && session.uid && doneToday(session.uid).mind,
  sayInChat(text) { const f = $('[data-chat]'); if (!f) return false; sayAny(f.dataset.chat, text); return true; },
  rerender: () => render(),
};

/* Arranque: si esta pestaña tenía sesión abierta, vuelve directo a la app. */
if (session) openApp();
})();
