/* =====================================================================
   FAVALORO · inicio (landing)
   Un solo bucle rAF corre la página: primero avanza Lenis (si cargó) y
   después cada sección lee su propio avance de scroll y escribe estilos
   directamente. Sin librerías de animación: todo es aritmética.
   ===================================================================== */
(() => {
'use strict';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const range = (v, a, b) => clamp((v - a) / (b - a));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = reducedMQ.matches;
reducedMQ.addEventListener('change', () => { reduced = reducedMQ.matches; });
const landing = () => document.body.dataset.view === 'landing';

// Las posiciones de las secciones se miden una sola vez por cuadro, antes de escribir estilos.
const pinned = new Set(), rects = new Map();
function pinProgress(el) {
  if (!pinned.has(el)) pinned.add(el);
  const rect = rects.get(el) || el.getBoundingClientRect();
  const vh = innerHeight;
  return {p: clamp(-rect.top / Math.max(1, rect.height - vh)), rect, vh};
}

/* ---------------- bucle único + Lenis ---------------- */
const subs = new Set();
const onFrame = (fn) => subs.add(fn);
let lenis = null;
if (!reduced && window.Lenis) lenis = new window.Lenis({lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9});
window.FVScroll = {
  stop() { if (lenis) lenis.stop(); },
  start() { if (lenis) lenis.start(); },
  top() { if (lenis) lenis.scrollTo(0, {immediate: true}); else scrollTo(0, 0); },
};
function loop(t) {
  if (lenis) lenis.raf(t);
  if (landing()) {
    rects.clear(); pinned.forEach((el) => rects.set(el, el.getBoundingClientRect()));
    subs.forEach((fn) => fn(t));
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function scrollToHash(hash) {
  const target = hash === '#top' ? 0 : $(hash);
  if (target === null) return;
  if (lenis) lenis.scrollTo(target, {duration: 1.6});
  else if (typeof target === 'number') scrollTo({top: 0});
  else target.scrollIntoView();
}

/* ---------------- cabecera y menú ---------------- */
const menu = $('#menu'), menuBtn = $('.menu-btn');
function setMenu(open) {
  menu.classList.toggle('open', open);
  menu.inert = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Cerrar' : 'Menú';
}
menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
$$('[data-go]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); setMenu(false); scrollToHash(a.getAttribute('href')); }));
$$('[data-login]').forEach((b) => b.addEventListener('click', () => setMenu(false)));

/* ---------------- valores en vivo del Astronauta 1 ---------------- */
setInterval(() => {
  const v = FV.live.a1;
  $$('[data-vital]').forEach((el) => { const k = el.dataset.vital; el.textContent = k === 'temp' ? FV.f1(v.temp) : String(Math.round(v[k])); });
}, 1000);

/* ======================================================================
   1 · EARTHRISE
     0.00–0.18  el polvo cósmico se despeja del lente
     0.04–0.50  la Tierra sale por detrás del horizonte
     0.08–0.52  el logo FAVALORO se enfoca entre la llanura y el cráter
     0.28–0.60  el borde del cráter se cierra; suben astronauta y suelo
     0.70–1.00  todo se va hacia arriba y el suelo tapa la pantalla
   ====================================================================== */
(() => {
  const root = $('#top');
  const L = {};
  $$('[data-l]', root).forEach((el) => { L[el.dataset.l] = el; });
  const veil = $('#erVeil'), canvas = $('#erDust'), title = $('#erTitle'), hud = $('#erHud');
  const clock = $('#erClock'), elev = $('#erElev'), h1 = $('#heroTitle'), brand = $('#brandLogo');
  const ctx = canvas.getContext('2d');
  const sync = () => { const d = Math.min(devicePixelRatio || 1, 1.25); canvas.width = Math.round(canvas.clientWidth * d); canvas.height = Math.round(canvas.clientHeight * d); };
  sync();
  new ResizeObserver(sync).observe(canvas);

  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const motes = Array.from({length: 140}, () => ({x: rand(), y: rand(), r: 0.4 + rand() * 1.6, s: 0.3 + rand(), a: 0.2 + rand() * 0.6}));
  let lastP = -1, lastT = 0;
  const set = (name, y, scale = 1, op = 1) => { L[name].style.transform = `translate3d(0, ${y}vh, 0) scale(${scale})`; L[name].style.opacity = op; };

  // El logo de la cabecera arranca grande arriba a la izquierda y se achica al bajar.
  let lastShrink = -1;
  onFrame(() => {
    const k = clamp(window.scrollY / (innerHeight * 0.6));
    if (Math.abs(k - lastShrink) < 0.002) return;
    lastShrink = k;
    brand.style.setProperty('--k', k.toFixed(3));
    // Pasado el inicio, la cabecera gana un fondo oscuro para que el logo no tape los textos.
    document.querySelector('.hdr').classList.toggle('solid', window.scrollY > innerHeight * 0.9);
  });

  onFrame((time) => {
    const dt = lastT ? Math.min(0.1, (time - lastT) / 1000) : 1 / 60;
    lastT = time;
    const {p, rect} = pinProgress(root);
    if (rect.bottom < 0) return;

    const v = 1 - range(p, 0, 0.18);
    if (v > 0.001) {
      const w = canvas.clientWidth, h = canvas.clientHeight, d = canvas.width / Math.max(1, w);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#dfe6f2';
      for (const m of motes) {
        if (!reduced) { m.x += 0.006 * m.s * dt; m.y -= 0.004 * m.s * dt; if (m.x > 1) m.x -= 1; if (m.y < 0) m.y += 1; }
        ctx.globalAlpha = m.a * v;
        ctx.beginPath();
        ctx.arc(m.x * w, (m.y - p * 0.6) * h, m.r * (1 + p * 4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (Math.abs(p - lastP) < 0.00005) return;
    lastP = p;
    const exit = range(p, 0.7, 1), settle = ease(range(p, 0, 0.5));
    veil.style.opacity = v;
    veil.style.transform = `translate3d(0, ${-range(p, 0, 0.18) * 24}vh, 0) scale(${1 + range(p, 0, 0.18) * 0.25})`;
    canvas.style.opacity = v;

    set('sky', lerp(0, -6, p), lerp(1.14, 1, settle));
    const rise = ease(range(p, 0.04, 0.5));
    set('earth', lerp(34, 0, rise) - exit * 12, lerp(0.92, 1, rise));
    set('moonscape', lerp(9, 0, settle) - exit * 26);
    const rim = ease(range(p, 0.28, 0.58));
    set('frame', -exit * 44, lerp(1.6, 1, rim), rim);
    const up = ease(range(p, 0.36, 0.62));
    set('astronaut', lerp(28, 0, up) - exit * 58, 1, clamp(up * 2));
    const gr = ease(range(p, 0.34, 0.6));
    set('ground', lerp(36, 0, gr) - exit * 78);

    // Título: se enfoca (el espaciado se cierra) y después cede ante el cráter.
    const tIn = ease(range(p, 0.08, 0.24)), tOut = range(p, 0.42, 0.52);
    title.style.opacity = tIn * (1 - tOut);
    h1.style.letterSpacing = `${lerp(0.6, 0.24, tIn)}em`;
    title.style.transform = `translate3d(0, ${-p * 6}vh, 0)`;
    title.style.filter = tIn < 0.99 ? `blur(${(1 - tIn) * 10}px)` : '';

    hud.style.opacity = range(p, 0.02, 0.1) * (1 - range(p, 0.62, 0.72));
    const secs = p * 5400, pad = (n) => String(Math.floor(n)).padStart(2, '0');
    clock.textContent = `T+ ${pad(secs / 3600)}:${pad((secs % 3600) / 60)}:${pad(secs % 60)}`;
    elev.textContent = `${(rise * 12.4).toFixed(1)}°`;
  });
})();

/* ======================================================================
   2 · ESCANEO BIOMÉTRICO CON MIRA
   Foto real (Apollo 11, NASA). La foto se inclina hacia el puntero; la
   mira lo sigue y, cuando pasa cerca de un sensor, lo enfoca y muestra lo
   que mide en vivo. El scroll hace un primer barrido que revela los
   sensores uno por uno.
   ====================================================================== */
(() => {
  const root = $('#escaneo');
  // x, y: posición del sensor en la foto (%). side: lado de la etiqueta.
  const S = [
    {id: 'head', n: 'Casco', where: 'Cabeza', how: 'Test de reacción y ánimo en la app. Ojos: examen médico.', x: 46.9, y: 13.6, side: 'r', k: ['react', 'mood']},
    {id: 'arm', n: 'Tensiómetro', where: 'Brazo izquierdo', how: 'Registro: se mide y se carga en la app.', x: 70.8, y: 30.5, side: 'r', k: ['bp']},
    {id: 'chest', n: 'Dosímetro', where: 'Pecho', how: 'Mide solo la radiación acumulada del día.', x: 47.9, y: 31.4, side: 'l', k: ['dose']},
    {id: 'glove', n: 'Glucómetro', where: 'Mano izquierda', how: 'Registro: una gota de sangre en ayunas.', x: 57.3, y: 41.5, side: 'r', k: ['glu']},
    {id: 'belly', n: 'Nutrición', where: 'Abdomen', how: 'Registro diario de comidas y agua.', x: 45.8, y: 50.8, side: 'l', k: ['water']},
    {id: 'wrist', n: 'Brazalete', where: 'Muñeca derecha', how: 'Mide solo pulso, oxígeno, temperatura y respiración.', x: 26.9, y: 56.6, side: 'l', k: ['hr', 'spo2', 'temp', 'rr']},
  ];
  const marks = $('#bsMarks'), list = $('#bsList'), scope = $('#bsScope'), read = $('#bsRead');
  const stage = $('#bsStage'), tiltEl = $('#bsTilt'), beam = $('#bsBeam'), frame = $('#bsFrame');

  marks.innerHTML = S.map((s, i) => `
    <button type="button" class="bs-mk ${s.side}" data-s="${s.id}" style="left:${s.x}%;top:${s.y}%" aria-label="${s.n}, ${s.where}">
      <svg class="bs-rings" viewBox="-40 -40 80 80" aria-hidden="true">
        <circle r="34" class="r1"/><circle r="24" class="r2"/><circle r="4" class="r3"/>
      </svg>
      <span class="bs-pill" aria-hidden="true"><i></i><span class="pn">${s.n}</span><b></b></span>
      <span class="bs-n" aria-hidden="true">0${i + 1}</span>
    </button>`).join('');
  list.innerHTML = S.map((s, i) => `<li><button type="button" data-s="${s.id}"><span class="label c-earth">0${i + 1}</span><span class="t">${s.n}<small>${s.where}</small></span><b></b></button></li>`).join('');

  // En pantallas chicas la lectura va fija abajo, no pegada a la mira.
  const mq = matchMedia('(max-width: 1023px)');
  const place = () => (mq.matches ? stage : scope).appendChild(read);
  place();
  mq.addEventListener('change', place);

  let sel = 'wrist', hover = false, lastAuto = performance.now();
  const val = (I, k) => I[k].val + (I[k].u && I[k].val !== '—' ? ' ' + I[k].u : '');

  function paint() {
    const I = FV.ind('a1');
    S.forEach((s) => {
      const st = FV.worst(s.k.map((k) => I[k].s)), c = FV.color(st === null && s.k.some((k) => I[k].s === 'i') ? 'i' : st);
      const mk = $(`.bs-mk[data-s="${s.id}"]`, marks);
      mk.style.setProperty('--c', c);
      mk.classList.toggle('sel', s.id === sel);
      $('b', mk).textContent = val(I, s.k[0]);
      const li = $(`button[data-s="${s.id}"]`, list);
      li.style.setProperty('--c', c);
      li.setAttribute('aria-pressed', String(s.id === sel));
      $('b', li).textContent = val(I, s.k[0]);
    });
    const s = S.find((x) => x.id === sel);
    read.innerHTML = `<p class="label">${s.where} · enfocado</p><h3>${s.n}</h3><p class="how">${s.how}</p><ul>${s.k.map((k) => `<li style="--c:${FV.color(I[k].s)}"><span>${I[k].n}</span><b>${I[k].val}<small>${I[k].u}</small></b><i></i></li>`).join('')}</ul>`;
  }
  paint();
  setInterval(paint, 1000);
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (!b) return; sel = b.dataset.s; lastAuto = performance.now() + 6000; paint(); });

  // Humo detrás del astronauta.
  const canvas = $('#bsSmoke'), ctx = canvas.getContext('2d');
  const sync = () => { canvas.width = Math.round(canvas.clientWidth * 0.35); canvas.height = Math.round(canvas.clientHeight * 0.35); };
  sync();
  new ResizeObserver(sync).observe(canvas);
  let sd = 5;
  const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const blobs = Array.from({length: 18}, (_, i) => ({x: 0.25 + rnd() * 0.6, y: 0.1 + rnd() * 0.85, r: 0.14 + rnd() * 0.24, sp: 0.04 + rnd() * 0.07, ph: rnd() * 6.3, c: i % 6 === 0 ? '242,230,201' : i % 2 ? '70,110,190' : '34,52,110', a: i % 6 === 0 ? 0.06 : 0.16}));
  function smoke(t) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const b of blobs) {
      const x = (b.x + Math.sin(t * b.sp + b.ph) * 0.12) * w, y = (b.y + Math.cos(t * b.sp * 0.8 + b.ph * 1.3) * 0.1) * h;
      const r = b.r * Math.max(w, h) * (1 + Math.sin(t * b.sp * 1.7 + b.ph) * 0.15);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${b.c},${b.a})`); g.addColorStop(0.6, `rgba(${b.c},${b.a * 0.35})`); g.addColorStop(1, `rgba(${b.c},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // Puntero → inclinación de la foto, humo en contra y mira.
  const ptr = {tx: 0, ty: 0, x: 0, y: 0, cx: -1, cy: -1};
  const sc = {x: 0, y: 0, init: false};
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = stage.getBoundingClientRect();
    ptr.cx = e.clientX - r.left; ptr.cy = e.clientY - r.top;
    ptr.tx = (ptr.cx / r.width) * 2 - 1; ptr.ty = (ptr.cy / r.height) * 2 - 1;
    hover = true;
  });
  stage.addEventListener('pointerleave', () => { hover = false; ptr.tx = 0; ptr.ty = 0; });

  let lastP = -1, frameN = 0;
  onFrame((time) => {
    const {p, rect, vh} = pinProgress(root);
    if (rect.bottom < 0 || rect.top > vh) return;
    // Primero se mide todo y después se escribe: así el navegador no recalcula el diseño en cada cuadro.
    const sr = stage.getBoundingClientRect(), fr = frame.getBoundingClientRect();
    const centers = S.map((s) => { const r = $(`.bs-mk[data-s="${s.id}"] .bs-rings`, marks).getBoundingClientRect(); return {id: s.id, x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top}; });
    // El humo se dibuja a la mitad de cuadros: se ve igual y cuesta la mitad.
    if (!reduced && (frameN++ & 1) === 0) smoke(time / 1000);

    if (!reduced) { ptr.x += (ptr.tx - ptr.x) * 0.07; ptr.y += (ptr.ty - ptr.y) * 0.07; }
    tiltEl.style.transform = `rotateY(${ptr.x * 7}deg) rotateX(${-ptr.y * 5}deg) translate3d(${ptr.x * 6}px, ${ptr.y * 4}px, 0)`;
    canvas.style.transform = `translate3d(${ptr.x * -24}px, ${ptr.y * -18}px, 0) scale(1.08)`;

    // Primer barrido con el scroll: revela los sensores de arriba hacia abajo.
    if (Math.abs(p - lastP) > 0.00005) {
      lastP = p;
      const enter = ease(range(p, 0, 0.12));
      frame.style.opacity = 0.2 + enter * 0.8;
      const k = reduced ? 1 : range(p, 0.06, 0.5);
      beam.style.top = `${k * 100 - 12}%`;
      beam.style.opacity = k > 0 && k < 1 ? 1 : 0;
      S.forEach((s) => $(`.bs-mk[data-s="${s.id}"]`, marks).classList.toggle('on', k * 100 >= s.y + 1));
      scope.classList.toggle('ready', k >= 1);
    }

    // Mira: sigue al puntero; si hay un sensor cerca, se engancha en él.
    let tx, ty, locked = false;
    // La mira solo sigue al puntero cuando está sobre el astronauta, nunca sobre los textos.
    const onPhoto = hover && ptr.cx >= 0 && ptr.cx + sr.left > fr.left - 30 && ptr.cx + sr.left < fr.right + 30 && ptr.cy + sr.top > fr.top - 30 && ptr.cy + sr.top < fr.bottom + 30;
    if (onPhoto) {
      let best = null, bd = 1e9;
      centers.forEach((c) => { const d = Math.hypot(c.x - ptr.cx, c.y - ptr.cy); if (d < bd) { bd = d; best = c; } });
      if (best && bd < 80) { tx = best.x; ty = best.y; locked = true; if (sel !== best.id) { sel = best.id; paint(); } }
      else { tx = ptr.cx; ty = ptr.cy; }
    } else {
      // Sin puntero: recorre los sensores solo, uno cada 3,5 s.
      if (!reduced && time - lastAuto > 3500) { const i = S.findIndex((s) => s.id === sel); sel = S[(i + 1) % S.length].id; lastAuto = time; paint(); }
      const c = centers.find((x) => x.id === sel); tx = c.x; ty = c.y; locked = true;
    }
    if (!sc.init) { sc.x = tx; sc.y = ty; sc.init = true; }
    const k2 = reduced ? 1 : 0.16;
    sc.x += (tx - sc.x) * k2; sc.y += (ty - sc.y) * k2;
    scope.style.transform = `translate3d(${sc.x}px, ${sc.y}px, 0)`;
    scope.classList.toggle('locked', locked);
    scope.classList.toggle('flip', sc.x > sr.width * 0.62);
  });
})();

/* ======================================================================
   3 · RECORRIDO DEL DATO
   ====================================================================== */
(() => {
  const root = $('#datos');
  const WINDOW = [0.06, 0.92], DISTANCE = 384400;
  const LEGS = ['M150 470 Q240 400 330 452', 'M330 450 Q420 330 270 232', 'M270 202 C 480 40, 760 60, 892 238', 'M1010 380 Q1060 440 1094 462'];
  const TEXT = [
    {when: '1 s', title: 'Brazalete → app', body: 'El brazalete manda pulso, oxígeno y temperatura por Bluetooth a la app del astronauta.'},
    {when: 'Al instante', title: 'App → antena de la base', body: 'La app arma el semáforo de salud y lo sube a la red del hábitat.'},
    {when: '1,3 s', title: 'Luna → Tierra', body: '384.400 km a la velocidad de la luz hasta el Control de Misión.'},
    {when: 'En vivo', title: 'Control → médico', body: 'El médico de vuelo ve las alertas y responde antes de que sean un problema.'},
  ];
  $('#dpStars').innerHTML = Array.from({length: 70}, (_, i) => `<circle cx="${(i * 173) % 1200}" cy="${(i * 97) % 600}" r="${i % 7 === 0 ? 1.4 : 0.7}" opacity="${0.15 + ((i * 37) % 50) / 100}"/>`).join('');
  $('#dpGhost').innerHTML = LEGS.map((d) => `<path d="${d}"/>`).join('');
  $('#dpLegs').innerHTML = LEGS.map((d, i) => `<path d="${d}" pathLength="1" stroke="${i === 2 ? '#6fb6ff' : '#f2e6c9'}" stroke-dasharray="1 1" stroke-dashoffset="1"/>`).join('');
  const paths = $$('#dpLegs path'), packet = $('#dpPacket'), km = $('#dpKm'), when = $('#dpWhen'), text = $('#dpText'), dots = $$('#dpDots span');
  let current = -1, lastP = -1;
  function showLeg(s) {
    current = s;
    const t = TEXT[s];
    when.textContent = `${t.when} · Tramo ${s + 1}/${TEXT.length}`;
    text.innerHTML = `<div><h3>${t.title}</h3><p class="b">${t.body}</p></div>`;
    dots.forEach((d, i) => d.classList.toggle('on', i <= s));
  }
  showLeg(0);
  onFrame(() => {
    const {p, rect, vh} = pinProgress(root);
    if (rect.bottom < 0 || rect.top > vh) return;
    if (Math.abs(p - lastP) < 0.00005) return;
    lastP = p;
    const u = range(p, WINDOW[0], WINDOW[1]) * LEGS.length;
    const s = clamp(Math.floor(u), 0, LEGS.length - 1);
    if (s !== current) showLeg(s);
    paths.forEach((path, i) => {
      const k = ease(clamp(u - i));
      path.style.strokeDashoffset = String(1 - k);
      if (i === s) { const pt = path.getPointAtLength(path.getTotalLength() * k); packet.setAttribute('transform', `translate(${pt.x} ${pt.y})`); }
    });
    km.textContent = Math.round(ease(clamp(u - 2)) * DISTANCE).toLocaleString('es-AR');
  });
})();

/* ---------------- 4 · roles ---------------- */
$('#rlCards').innerHTML = Object.entries(FV.ROLES).map(([k, r], i) => `
  <li data-reveal style="transition-delay:${i * 110}ms" class="${k === 'crew' ? 'feat' : ''}">
    <svg class="rings" viewBox="0 0 200 200" aria-hidden="true">${Array.from({length: i + 1}, (_, j) => `<ellipse cx="100" cy="100" rx="${40 + j * 18}" ry="${18 + j * 8}" transform="rotate(${-20 + j * 14} 100 100)"/>`).join('')}<circle cx="100" cy="100" r="9"/></svg>
    <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${r.ico}"/></svg>
    <h3>${r.n}</h3><p>${r.d}</p>
    <button type="button" class="label rl-go" data-login="${k}">Ingresar como ${r.n.toLowerCase()} →</button>
  </li>`).join('');

/* ---------------- apariciones al entrar en pantalla ---------------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (!en.isIntersecting) return; en.target.classList.add('is-in'); io.unobserve(en.target); });
}, {rootMargin: '0px 0px -10% 0px'});
$$('[data-reveal]').forEach((el) => io.observe(el));
})();
